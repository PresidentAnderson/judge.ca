import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface VideoConsultation {
  id: string;
  userId: string;
  attorneyId: string;
  matchId?: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'started' | 'completed' | 'cancelled' | 'no_show';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  recordingUrl?: string;
  recordingEnabled: boolean;
  costAmount?: number;
  costCurrency: 'CAD';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  remindersSent: number;
  userJoinedAt?: Date;
  attorneyJoinedAt?: Date;
  endedAt?: Date;
  cancellationReason?: string;
  cancellationBy?: 'user' | 'attorney' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

interface TimeSlot {
  id: string;
  attorneyId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // in minutes
  isAvailable: boolean;
  consultationType: 'initial' | 'follow_up' | 'emergency';
  costAmount: number;
  timezone: string;
}

interface ConsultationPreferences {
  attorneyId: string;
  defaultDuration: number;
  minAdvanceBooking: number; // hours
  maxAdvanceBooking: number; // days
  bufferTime: number; // minutes between consultations
  workingHours: {
    [key: string]: { // day of week
      enabled: boolean;
      start: string; // HH:MM
      end: string; // HH:MM
    };
  };
  consultationTypes: {
    initial: { enabled: boolean; duration: number; cost: number; };
    follow_up: { enabled: boolean; duration: number; cost: number; };
    emergency: { enabled: boolean; duration: number; cost: number; };
  };
  recordingPolicy: 'always' | 'optional' | 'never';
  cancellationPolicy: {
    allowUserCancellation: boolean;
    freecancellationHours: number;
    cancellationFeePercentage: number;
  };
}

export class VideoConsultationService {
  private readonly ZOOM_API_BASE = 'https://api.zoom.us/v2';
  private readonly ZOOM_JWT_TOKEN = process.env.ZOOM_JWT_TOKEN;
  
  async scheduleConsultation(
    userId: string,
    attorneyId: string,
    scheduledAt: Date,
    duration: number,
    consultationType: 'initial' | 'follow_up' | 'emergency',
    description?: string,
    matchId?: string
  ): Promise<VideoConsultation> {
    try {
      // Validate time slot availability
      const isAvailable = await this.checkTimeSlotAvailability(attorneyId, scheduledAt, duration);
      if (!isAvailable) {
        throw new Error('Time slot not available');
      }

      // Get attorney consultation preferences
      const preferences = await this.getConsultationPreferences(attorneyId);
      if (!preferences.consultationTypes[consultationType]?.enabled) {
        throw new Error('Consultation type not available');
      }

      // Calculate cost
      const costAmount = preferences.consultationTypes[consultationType].cost;

      // Create Zoom meeting
      const meetingDetails = await this.createZoomMeeting(attorneyId, scheduledAt, duration);

      // Create consultation record
      const consultationData = {
        id: uuidv4(),
        user_id: userId,
        attorney_id: attorneyId,
        match_id: matchId,
        title: `${consultationType.charAt(0).toUpperCase() + consultationType.slice(1)} Consultation`,
        description,
        scheduled_at: scheduledAt,
        duration,
        status: 'scheduled',
        meeting_url: meetingDetails.join_url,
        meeting_id: meetingDetails.id,
        meeting_password: meetingDetails.password,
        recording_enabled: preferences.recordingPolicy !== 'never',
        cost_amount: costAmount,
        cost_currency: 'CAD',
        payment_status: 'pending',
        reminders_sent: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [consultation] = await db('video_consultations')
        .insert(consultationData)
        .returning('*');

      // Block time slot
      await this.blockTimeSlot(attorneyId, scheduledAt, duration);

      // Schedule reminders
      await this.scheduleReminders(consultation.id);

      // Send confirmation notifications
      await this.sendConsultationNotifications(consultation.id, 'scheduled');

      return this.transformConsultation(consultation);
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      throw new Error('Failed to schedule consultation');
    }
  }

  async getAvailableTimeSlots(
    attorneyId: string,
    startDate: Date,
    endDate: Date,
    consultationType: 'initial' | 'follow_up' | 'emergency'
  ): Promise<TimeSlot[]> {
    try {
      const preferences = await this.getConsultationPreferences(attorneyId);
      const duration = preferences.consultationTypes[consultationType]?.duration || 60;
      const cost = preferences.consultationTypes[consultationType]?.cost || 200;

      if (!preferences.consultationTypes[consultationType]?.enabled) {
        return []; // Consultation type not available
      }

      const availableSlots: TimeSlot[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const workingHours = preferences.workingHours[dayOfWeek];

        if (workingHours?.enabled) {
          const slots = await this.generateDayTimeSlots(
            attorneyId,
            currentDate,
            workingHours,
            duration,
            cost,
            consultationType,
            preferences
          );
          availableSlots.push(...slots);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw new Error('Failed to get available time slots');
    }
  }

  async getUserConsultations(
    userId: string,
    status?: string,
    page = 1,
    limit = 20
  ): Promise<{ consultations: VideoConsultation[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db('video_consultations')
        .where('user_id', userId);

      if (status) {
        query = query.where('status', status);
      }

      const consultations = await query
        .orderBy('scheduled_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('video_consultations')
        .where('user_id', userId)
        .modify((builder) => {
          if (status) builder.where('status', status);
        })
        .count('* as count')
        .first();

      return {
        consultations: consultations.map(c => this.transformConsultation(c)),
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting user consultations:', error);
      throw new Error('Failed to get user consultations');
    }
  }

  async getAttorneyConsultations(
    attorneyId: string,
    status?: string,
    page = 1,
    limit = 20
  ): Promise<{ consultations: VideoConsultation[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db('video_consultations')
        .where('attorney_id', attorneyId);

      if (status) {
        query = query.where('status', status);
      }

      const consultations = await query
        .orderBy('scheduled_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .modify((builder) => {
          if (status) builder.where('status', status);
        })
        .count('* as count')
        .first();

      return {
        consultations: consultations.map(c => this.transformConsultation(c)),
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting attorney consultations:', error);
      throw new Error('Failed to get attorney consultations');
    }
  }

  async rescheduleConsultation(
    consultationId: string,
    newScheduledAt: Date,
    requestedBy: 'user' | 'attorney',
    reason?: string
  ): Promise<VideoConsultation> {
    try {
      const consultation = await db('video_consultations')
        .where('id', consultationId)
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.status !== 'scheduled') {
        throw new Error('Only scheduled consultations can be rescheduled');
      }

      // Check if reschedule is allowed based on timing
      const hoursUntilConsultation = (new Date(consultation.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilConsultation < 24 && requestedBy === 'user') {
        throw new Error('Cannot reschedule less than 24 hours before consultation');
      }

      // Check new time slot availability
      const isAvailable = await this.checkTimeSlotAvailability(
        consultation.attorney_id, 
        newScheduledAt, 
        consultation.duration
      );
      if (!isAvailable) {
        throw new Error('New time slot not available');
      }

      // Update Zoom meeting
      await this.updateZoomMeeting(consultation.meeting_id, newScheduledAt, consultation.duration);

      // Free old time slot
      await this.freeTimeSlot(consultation.attorney_id, new Date(consultation.scheduled_at), consultation.duration);

      // Block new time slot
      await this.blockTimeSlot(consultation.attorney_id, newScheduledAt, consultation.duration);

      // Update consultation
      const updatedData = {
        scheduled_at: newScheduledAt,
        updated_at: new Date(),
        reschedule_reason: reason,
        reschedule_by: requestedBy,
        reschedule_count: (consultation.reschedule_count || 0) + 1
      };

      await db('video_consultations')
        .where('id', consultationId)
        .update(updatedData);

      // Clear old reminders and schedule new ones
      await this.clearReminders(consultationId);
      await this.scheduleReminders(consultationId);

      // Send rescheduling notifications
      await this.sendConsultationNotifications(consultationId, 'rescheduled', { 
        newDateTime: newScheduledAt,
        reason 
      });

      const updated = await db('video_consultations')
        .where('id', consultationId)
        .first();

      return this.transformConsultation(updated);
    } catch (error) {
      console.error('Error rescheduling consultation:', error);
      throw new Error('Failed to reschedule consultation');
    }
  }

  async cancelConsultation(
    consultationId: string,
    cancelledBy: 'user' | 'attorney' | 'system',
    reason?: string
  ): Promise<VideoConsultation> {
    try {
      const consultation = await db('video_consultations')
        .where('id', consultationId)
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.status === 'cancelled') {
        throw new Error('Consultation already cancelled');
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = await this.calculateRefundAmount(consultation, cancelledBy);

      // Cancel Zoom meeting
      if (consultation.meeting_id) {
        await this.cancelZoomMeeting(consultation.meeting_id);
      }

      // Free time slot
      await this.freeTimeSlot(
        consultation.attorney_id, 
        new Date(consultation.scheduled_at), 
        consultation.duration
      );

      // Update consultation
      const updateData = {
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_by: cancelledBy,
        cancelled_at: new Date(),
        refund_amount: refundAmount,
        updated_at: new Date()
      };

      await db('video_consultations')
        .where('id', consultationId)
        .update(updateData);

      // Process refund if applicable
      if (refundAmount > 0) {
        await this.processRefund(consultationId, refundAmount);
      }

      // Clear reminders
      await this.clearReminders(consultationId);

      // Send cancellation notifications
      await this.sendConsultationNotifications(consultationId, 'cancelled', { 
        reason,
        refundAmount 
      });

      const updated = await db('video_consultations')
        .where('id', consultationId)
        .first();

      return this.transformConsultation(updated);
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      throw new Error('Failed to cancel consultation');
    }
  }

  async startConsultation(consultationId: string, participantType: 'user' | 'attorney'): Promise<{
    meetingUrl: string;
    meetingId: string;
    password?: string;
  }> {
    try {
      const consultation = await db('video_consultations')
        .where('id', consultationId)
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.status !== 'scheduled') {
        throw new Error('Consultation not in scheduled status');
      }

      // Update consultation status
      const updateData: any = { updated_at: new Date() };
      
      if (participantType === 'user' && !consultation.user_joined_at) {
        updateData.user_joined_at = new Date();
      } else if (participantType === 'attorney' && !consultation.attorney_joined_at) {
        updateData.attorney_joined_at = new Date();
      }

      // If first participant, mark as started
      if (!consultation.user_joined_at && !consultation.attorney_joined_at) {
        updateData.status = 'started';
        updateData.started_at = new Date();
      }

      await db('video_consultations')
        .where('id', consultationId)
        .update(updateData);

      return {
        meetingUrl: consultation.meeting_url,
        meetingId: consultation.meeting_id,
        password: consultation.meeting_password
      };
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw new Error('Failed to start consultation');
    }
  }

  async endConsultation(consultationId: string, summary?: string): Promise<VideoConsultation> {
    try {
      const consultation = await db('video_consultations')
        .where('id', consultationId)
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Get recording URL if recording was enabled
      let recordingUrl = null;
      if (consultation.recording_enabled && consultation.meeting_id) {
        recordingUrl = await this.getZoomRecording(consultation.meeting_id);
      }

      // Update consultation
      const updateData = {
        status: 'completed',
        ended_at: new Date(),
        recording_url: recordingUrl,
        consultation_summary: summary,
        updated_at: new Date()
      };

      await db('video_consultations')
        .where('id', consultationId)
        .update(updateData);

      // Send completion notifications and follow-up
      await this.sendConsultationNotifications(consultationId, 'completed');

      const updated = await db('video_consultations')
        .where('id', consultationId)
        .first();

      return this.transformConsultation(updated);
    } catch (error) {
      console.error('Error ending consultation:', error);
      throw new Error('Failed to end consultation');
    }
  }

  private async checkTimeSlotAvailability(
    attorneyId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    try {
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);

      const conflicts = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('status', 'scheduled')
        .where(function() {
          this.whereBetween('scheduled_at', [scheduledAt, endTime])
            .orWhere(function() {
              this.where('scheduled_at', '<=', scheduledAt)
                .whereRaw('scheduled_at + INTERVAL duration MINUTE > ?', [scheduledAt]);
            });
        });

      return conflicts.length === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  private async getConsultationPreferences(attorneyId: string): Promise<ConsultationPreferences> {
    try {
      const preferences = await db('attorney_consultation_preferences')
        .where('attorney_id', attorneyId)
        .first();

      if (!preferences) {
        // Return default preferences
        return {
          attorneyId,
          defaultDuration: 60,
          minAdvanceBooking: 24,
          maxAdvanceBooking: 30,
          bufferTime: 15,
          workingHours: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
          },
          consultationTypes: {
            initial: { enabled: true, duration: 60, cost: 300 },
            follow_up: { enabled: true, duration: 30, cost: 150 },
            emergency: { enabled: true, duration: 45, cost: 400 }
          },
          recordingPolicy: 'optional',
          cancellationPolicy: {
            allowUserCancellation: true,
            freeCancel­lationHours: 24,
            cancellationFeePercentage: 25
          }
        };
      }

      return {
        attorneyId: preferences.attorney_id,
        defaultDuration: preferences.default_duration,
        minAdvanceBooking: preferences.min_advance_booking,
        maxAdvanceBooking: preferences.max_advance_booking,
        bufferTime: preferences.buffer_time,
        workingHours: JSON.parse(preferences.working_hours),
        consultationTypes: JSON.parse(preferences.consultation_types),
        recordingPolicy: preferences.recording_policy,
        cancellationPolicy: JSON.parse(preferences.cancellation_policy)
      };
    } catch (error) {
      console.error('Error getting consultation preferences:', error);
      throw new Error('Failed to get consultation preferences');
    }
  }

  private async generateDayTimeSlots(
    attorneyId: string,
    date: Date,
    workingHours: any,
    duration: number,
    cost: number,
    consultationType: string,
    preferences: ConsultationPreferences
  ): Promise<TimeSlot[]> {
    try {
      const slots: TimeSlot[] = [];
      const dateStr = date.toISOString().split('T')[0];
      
      // Parse working hours
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Check minimum advance booking
      const minBookingTime = new Date();
      minBookingTime.setHours(minBookingTime.getHours() + preferences.minAdvanceBooking);

      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime.getTime() + duration * 60000);
        
        // Check if slot fits within working hours
        if (slotEndTime <= endTime && currentTime >= minBookingTime) {
          // Check availability
          const isAvailable = await this.checkTimeSlotAvailability(attorneyId, currentTime, duration);
          
          if (isAvailable) {
            slots.push({
              id: uuidv4(),
              attorneyId,
              date: dateStr,
              startTime: currentTime.toTimeString().substring(0, 5),
              endTime: slotEndTime.toTimeString().substring(0, 5),
              duration,
              isAvailable: true,
              consultationType: consultationType as any,
              costAmount: cost,
              timezone: 'America/Montreal' // Default timezone
            });
          }
        }

        // Move to next slot (duration + buffer time)
        currentTime.setMinutes(currentTime.getMinutes() + duration + preferences.bufferTime);
      }

      return slots;
    } catch (error) {
      console.error('Error generating day time slots:', error);
      return [];
    }
  }

  private async createZoomMeeting(attorneyId: string, scheduledAt: Date, duration: number): Promise<any> {
    try {
      // Mock Zoom API call - in production, implement actual Zoom integration
      const meetingData = {
        id: `zoom_${Date.now()}`,
        join_url: `https://zoom.us/j/${Date.now()}`,
        password: crypto.randomBytes(4).toString('hex').toUpperCase(),
        start_time: scheduledAt.toISOString(),
        duration: duration,
        topic: 'Legal Consultation - Judge.ca'
      };

      // Store meeting details
      await db('zoom_meetings').insert({
        id: uuidv4(),
        attorney_id: attorneyId,
        zoom_meeting_id: meetingData.id,
        meeting_data: JSON.stringify(meetingData),
        created_at: new Date()
      });

      return meetingData;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create video meeting');
    }
  }

  private async updateZoomMeeting(meetingId: string, newScheduledAt: Date, duration: number): Promise<void> {
    // Mock implementation - in production, call Zoom API
    console.log(`Updating Zoom meeting ${meetingId} to ${newScheduledAt}`);
  }

  private async cancelZoomMeeting(meetingId: string): Promise<void> {
    // Mock implementation - in production, call Zoom API
    console.log(`Cancelling Zoom meeting ${meetingId}`);
  }

  private async getZoomRecording(meetingId: string): Promise<string | null> {
    // Mock implementation - in production, fetch from Zoom API
    return `https://recordings.zoom.us/${meetingId}`;
  }

  private async blockTimeSlot(attorneyId: string, scheduledAt: Date, duration: number): Promise<void> {
    // This could create blocked time slots in a separate table
    // For now, we rely on the consultation record itself
  }

  private async freeTimeSlot(attorneyId: string, scheduledAt: Date, duration: number): Promise<void> {
    // This would remove blocked time slots
    // For now, we rely on the consultation status
  }

  private async scheduleReminders(consultationId: string): Promise<void> {
    // Mock implementation - in production, use job queue like Bull or agenda
    console.log(`Scheduling reminders for consultation ${consultationId}`);
  }

  private async clearReminders(consultationId: string): Promise<void> {
    // Mock implementation - in production, clear scheduled jobs
    console.log(`Clearing reminders for consultation ${consultationId}`);
  }

  private async calculateRefundAmount(consultation: any, cancelledBy: string): Promise<number> {
    if (!consultation.cost_amount) return 0;

    const preferences = await this.getConsultationPreferences(consultation.attorney_id);
    const hoursUntil = (new Date(consultation.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);

    if (cancelledBy === 'attorney') {
      return consultation.cost_amount; // Full refund if attorney cancels
    }

    if (hoursUntil >= preferences.cancellationPolicy.freeCancel­lationHours) {
      return consultation.cost_amount; // Full refund if cancelled with enough notice
    }

    // Partial refund based on policy
    const feePercentage = preferences.cancellationPolicy.cancellationFeePercentage / 100;
    return consultation.cost_amount * (1 - feePercentage);
  }

  private async processRefund(consultationId: string, amount: number): Promise<void> {
    // Mock implementation - in production, integrate with payment processor
    console.log(`Processing refund of ${amount} CAD for consultation ${consultationId}`);
  }

  private async sendConsultationNotifications(
    consultationId: string,
    type: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed',
    data?: any
  ): Promise<void> {
    // Mock implementation - in production, send email/SMS/push notifications
    console.log(`Sending ${type} notification for consultation ${consultationId}`);
  }

  private transformConsultation(consultation: any): VideoConsultation {
    return {
      id: consultation.id,
      userId: consultation.user_id,
      attorneyId: consultation.attorney_id,
      matchId: consultation.match_id,
      title: consultation.title,
      description: consultation.description,
      scheduledAt: consultation.scheduled_at,
      duration: consultation.duration,
      status: consultation.status,
      meetingUrl: consultation.meeting_url,
      meetingId: consultation.meeting_id,
      meetingPassword: consultation.meeting_password,
      recordingUrl: consultation.recording_url,
      recordingEnabled: consultation.recording_enabled,
      costAmount: consultation.cost_amount,
      costCurrency: consultation.cost_currency,
      paymentStatus: consultation.payment_status,
      remindersSent: consultation.reminders_sent || 0,
      userJoinedAt: consultation.user_joined_at,
      attorneyJoinedAt: consultation.attorney_joined_at,
      endedAt: consultation.ended_at,
      cancellationReason: consultation.cancellation_reason,
      cancellationBy: consultation.cancellation_by,
      createdAt: consultation.created_at,
      updatedAt: consultation.updated_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE video_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'completed', 'cancelled', 'no_show')),
  meeting_url VARCHAR(500),
  meeting_id VARCHAR(255),
  meeting_password VARCHAR(100),
  recording_url VARCHAR(500),
  recording_enabled BOOLEAN DEFAULT FALSE,
  cost_amount DECIMAL(10,2),
  cost_currency VARCHAR(3) DEFAULT 'CAD',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  reminders_sent INTEGER DEFAULT 0,
  user_joined_at TIMESTAMP,
  attorney_joined_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  consultation_summary TEXT,
  cancellation_reason TEXT,
  cancellation_by VARCHAR(10) CHECK (cancellation_by IN ('user', 'attorney', 'system')),
  cancelled_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  reschedule_reason TEXT,
  reschedule_by VARCHAR(10) CHECK (reschedule_by IN ('user', 'attorney')),
  reschedule_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attorney_consultation_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE UNIQUE,
  default_duration INTEGER DEFAULT 60,
  min_advance_booking INTEGER DEFAULT 24, -- hours
  max_advance_booking INTEGER DEFAULT 30, -- days
  buffer_time INTEGER DEFAULT 15, -- minutes
  working_hours JSONB NOT NULL,
  consultation_types JSONB NOT NULL,
  recording_policy VARCHAR(20) DEFAULT 'optional' CHECK (recording_policy IN ('always', 'optional', 'never')),
  cancellation_policy JSONB NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Montreal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zoom_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES video_consultations(id) ON DELETE CASCADE,
  zoom_meeting_id VARCHAR(255) NOT NULL,
  meeting_data JSONB,
  recording_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_consultations_user_id ON video_consultations(user_id);
CREATE INDEX idx_video_consultations_attorney_id ON video_consultations(attorney_id);
CREATE INDEX idx_video_consultations_scheduled_at ON video_consultations(scheduled_at);
CREATE INDEX idx_video_consultations_status ON video_consultations(status);
CREATE INDEX idx_attorney_consultation_preferences_attorney_id ON attorney_consultation_preferences(attorney_id);
CREATE INDEX idx_zoom_meetings_attorney_id ON zoom_meetings(attorney_id);
CREATE INDEX idx_zoom_meetings_consultation_id ON zoom_meetings(consultation_id);
*/