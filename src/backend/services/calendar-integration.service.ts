import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { CalendarDateTime, ICalCalendar, ICalEventData } from 'ical-generator';
import ical from 'ical-generator';

interface CalendarEvent {
  id: string;
  externalId?: string;
  provider: 'google' | 'outlook' | 'apple' | 'other';
  userId: string;
  userType: 'user' | 'attorney';
  consultationId?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendees: Array<{
    email: string;
    name?: string;
    status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  reminders: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  isAllDay: boolean;
  isBusy: boolean;
  meetingUrl?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarConnection {
  id: string;
  userId: string;
  userType: 'user' | 'attorney';
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarId: string;
  isActive: boolean;
  isPrimary: boolean;
  syncEnabled: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
}

interface CalendarAvailability {
  date: string; // YYYY-MM-DD
  timeSlots: Array<{
    start: string; // HH:MM
    end: string; // HH:MM
    isAvailable: boolean;
  }>;
}

export class CalendarIntegrationService {
  private googleOAuth2Client: any;
  private microsoftClient: Client;

  constructor() {
    // Initialize Google OAuth2 Client
    this.googleOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Initialize Microsoft Graph Client
    this.microsoftClient = Client.init({
      authProvider: (done) => {
        // This will be set per request with user's token
        done(null, '');
      }
    });
  }

  async connectCalendar(
    userId: string,
    userType: 'user' | 'attorney',
    provider: 'google' | 'outlook',
    authCode: string
  ): Promise<CalendarConnection> {
    try {
      let connectionData: any;

      switch (provider) {
        case 'google':
          connectionData = await this.connectGoogleCalendar(authCode);
          break;
        case 'outlook':
          connectionData = await this.connectOutlookCalendar(authCode);
          break;
        default:
          throw new Error('Unsupported calendar provider');
      }

      // Check if connection already exists
      const existingConnection = await db('calendar_connections')
        .where('user_id', userId)
        .where('provider', provider)
        .where('email', connectionData.email)
        .first();

      if (existingConnection) {
        // Update existing connection
        await db('calendar_connections')
          .where('id', existingConnection.id)
          .update({
            access_token: connectionData.accessToken,
            refresh_token: connectionData.refreshToken,
            token_expires_at: connectionData.tokenExpiresAt,
            is_active: true,
            updated_at: new Date()
          });

        return this.transformCalendarConnection(existingConnection);
      }

      // Create new connection
      const connection = {
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        provider,
        email: connectionData.email,
        access_token: connectionData.accessToken,
        refresh_token: connectionData.refreshToken,
        token_expires_at: connectionData.tokenExpiresAt,
        calendar_id: connectionData.calendarId,
        is_active: true,
        is_primary: false, // User can set primary later
        sync_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedConnection] = await db('calendar_connections')
        .insert(connection)
        .returning('*');

      // Initial sync
      await this.syncCalendarEvents(savedConnection.id);

      return this.transformCalendarConnection(savedConnection);
    } catch (error) {
      console.error('Error connecting calendar:', error);
      throw new Error('Failed to connect calendar');
    }
  }

  async disconnectCalendar(connectionId: string, userId: string): Promise<void> {
    try {
      await db('calendar_connections')
        .where('id', connectionId)
        .where('user_id', userId)
        .update({
          is_active: false,
          sync_enabled: false,
          updated_at: new Date()
        });

      // Remove synced events
      await db('calendar_events')
        .where('connection_id', connectionId)
        .delete();
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      throw new Error('Failed to disconnect calendar');
    }
  }

  async createCalendarEvent(
    userId: string,
    userType: 'user' | 'attorney',
    event: {
      consultationId?: string;
      title: string;
      description?: string;
      location?: string;
      startTime: Date;
      endTime: Date;
      timezone?: string;
      attendees: Array<{ email: string; name?: string }>;
      reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>;
      meetingUrl?: string;
    }
  ): Promise<CalendarEvent> {
    try {
      // Get primary calendar connection
      const primaryConnection = await db('calendar_connections')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_active', true)
        .where('is_primary', true)
        .first();

      // Create local event
      const calendarEvent = {
        id: uuidv4(),
        provider: primaryConnection?.provider || 'other',
        user_id: userId,
        user_type: userType,
        consultation_id: event.consultationId,
        title: event.title,
        description: event.description,
        location: event.location,
        start_time: event.startTime,
        end_time: event.endTime,
        timezone: event.timezone || 'America/Montreal',
        attendees: JSON.stringify(event.attendees),
        reminders: JSON.stringify(event.reminders || [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 60 } // 1 hour
        ]),
        status: 'confirmed',
        is_all_day: false,
        is_busy: true,
        meeting_url: event.meetingUrl,
        sync_status: primaryConnection ? 'pending' : 'synced',
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedEvent] = await db('calendar_events')
        .insert(calendarEvent)
        .returning('*');

      // Sync to external calendar if connected
      if (primaryConnection) {
        await this.syncEventToProvider(savedEvent, primaryConnection);
      }

      // Send calendar invitations
      await this.sendCalendarInvitations(savedEvent);

      return this.transformCalendarEvent(savedEvent);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async updateCalendarEvent(
    eventId: string,
    userId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    try {
      const event = await db('calendar_events')
        .where('id', eventId)
        .where('user_id', userId)
        .first();

      if (!event) {
        throw new Error('Event not found');
      }

      await db('calendar_events')
        .where('id', eventId)
        .update({
          ...updates,
          updated_at: new Date()
        });

      const updatedEvent = await db('calendar_events')
        .where('id', eventId)
        .first();

      // Sync updates to external calendar
      const connection = await db('calendar_connections')
        .where('user_id', userId)
        .where('is_primary', true)
        .where('is_active', true)
        .first();

      if (connection && updatedEvent.external_id) {
        await this.updateProviderEvent(updatedEvent, connection);
      }

      // Send update notifications
      await this.sendEventUpdateNotifications(updatedEvent);

      return this.transformCalendarEvent(updatedEvent);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  async cancelCalendarEvent(
    eventId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const event = await db('calendar_events')
        .where('id', eventId)
        .where('user_id', userId)
        .first();

      if (!event) {
        throw new Error('Event not found');
      }

      await db('calendar_events')
        .where('id', eventId)
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date()
        });

      // Cancel in external calendar
      const connection = await db('calendar_connections')
        .where('user_id', userId)
        .where('is_primary', true)
        .where('is_active', true)
        .first();

      if (connection && event.external_id) {
        await this.cancelProviderEvent(event, connection);
      }

      // Send cancellation notifications
      await this.sendCancellationNotifications(event, reason);
    } catch (error) {
      console.error('Error cancelling calendar event:', error);
      throw new Error('Failed to cancel calendar event');
    }
  }

  async getAvailability(
    userId: string,
    userType: 'user' | 'attorney',
    startDate: Date,
    endDate: Date,
    duration: number // in minutes
  ): Promise<CalendarAvailability[]> {
    try {
      // Get user's calendar events
      const events = await db('calendar_events')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('status', 'confirmed')
        .whereBetween('start_time', [startDate, endDate])
        .orderBy('start_time');

      // Get working hours preferences
      const workingHours = await this.getWorkingHours(userId, userType);

      // Generate availability slots
      const availability: CalendarAvailability[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayWorkingHours = workingHours[dayOfWeek];

        if (dayWorkingHours?.enabled) {
          const daySlots = this.generateDayAvailability(
            currentDate,
            dayWorkingHours,
            events.filter(e => 
              new Date(e.start_time).toDateString() === currentDate.toDateString()
            ),
            duration
          );

          availability.push({
            date: currentDate.toISOString().split('T')[0],
            timeSlots: daySlots
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability;
    } catch (error) {
      console.error('Error getting availability:', error);
      throw new Error('Failed to get availability');
    }
  }

  async syncCalendarEvents(connectionId: string): Promise<void> {
    try {
      const connection = await db('calendar_connections')
        .where('id', connectionId)
        .first();

      if (!connection || !connection.is_active) {
        return;
      }

      let events: any[] = [];

      switch (connection.provider) {
        case 'google':
          events = await this.fetchGoogleEvents(connection);
          break;
        case 'outlook':
          events = await this.fetchOutlookEvents(connection);
          break;
      }

      // Process fetched events
      for (const externalEvent of events) {
        const existingEvent = await db('calendar_events')
          .where('external_id', externalEvent.id)
          .where('user_id', connection.user_id)
          .first();

        if (existingEvent) {
          // Update existing event
          await db('calendar_events')
            .where('id', existingEvent.id)
            .update({
              title: externalEvent.summary,
              description: externalEvent.description,
              start_time: externalEvent.start,
              end_time: externalEvent.end,
              location: externalEvent.location,
              status: externalEvent.status,
              sync_status: 'synced',
              last_synced_at: new Date(),
              updated_at: new Date()
            });
        } else {
          // Create new event
          await db('calendar_events').insert({
            id: uuidv4(),
            external_id: externalEvent.id,
            provider: connection.provider,
            user_id: connection.user_id,
            user_type: connection.user_type,
            title: externalEvent.summary,
            description: externalEvent.description,
            location: externalEvent.location,
            start_time: externalEvent.start,
            end_time: externalEvent.end,
            timezone: externalEvent.timezone || 'America/Montreal',
            attendees: JSON.stringify(externalEvent.attendees || []),
            reminders: JSON.stringify(externalEvent.reminders || []),
            status: externalEvent.status || 'confirmed',
            is_all_day: externalEvent.isAllDay || false,
            is_busy: true,
            sync_status: 'synced',
            last_synced_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Update connection last synced
      await db('calendar_connections')
        .where('id', connectionId)
        .update({
          last_synced_at: new Date(),
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      throw new Error('Failed to sync calendar events');
    }
  }

  async getCalendarConnections(
    userId: string,
    userType: 'user' | 'attorney'
  ): Promise<CalendarConnection[]> {
    try {
      const connections = await db('calendar_connections')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      return connections.map(conn => this.transformCalendarConnection(conn));
    } catch (error) {
      console.error('Error getting calendar connections:', error);
      throw new Error('Failed to get calendar connections');
    }
  }

  async setPrimaryCalendar(
    connectionId: string,
    userId: string
  ): Promise<void> {
    try {
      // Reset all other connections
      await db('calendar_connections')
        .where('user_id', userId)
        .update({ is_primary: false });

      // Set selected as primary
      await db('calendar_connections')
        .where('id', connectionId)
        .where('user_id', userId)
        .update({
          is_primary: true,
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error setting primary calendar:', error);
      throw new Error('Failed to set primary calendar');
    }
  }

  private async connectGoogleCalendar(authCode: string): Promise<any> {
    const { tokens } = await this.googleOAuth2Client.getToken(authCode);
    this.googleOAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: this.googleOAuth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    return {
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      calendarId: 'primary'
    };
  }

  private async connectOutlookCalendar(authCode: string): Promise<any> {
    // Exchange auth code for tokens using Microsoft Identity Platform
    const tokenResponse = await this.exchangeOutlookAuthCode(authCode);
    
    // Get user info
    const client = Client.init({
      authProvider: (done) => {
        done(null, tokenResponse.access_token);
      }
    });

    const userInfo = await client.api('/me').get();

    return {
      email: userInfo.mail || userInfo.userPrincipalName,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      calendarId: 'primary'
    };
  }

  private async exchangeOutlookAuthCode(authCode: string): Promise<any> {
    // Mock implementation - in production, use MSAL or direct API calls
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600
    };
  }

  private async fetchGoogleEvents(connection: any): Promise<any[]> {
    this.googleOAuth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
    
    const response = await calendar.events.list({
      calendarId: connection.calendar_id || 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items?.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      status: event.status,
      attendees: event.attendees?.map(att => ({
        email: att.email,
        status: att.responseStatus
      })),
      reminders: event.reminders?.overrides
    })) || [];
  }

  private async fetchOutlookEvents(connection: any): Promise<any[]> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, connection.access_token);
      }
    });

    const events = await client
      .api('/me/calendar/events')
      .filter(`start/dateTime ge '${new Date().toISOString()}'`)
      .top(100)
      .orderby('start/dateTime')
      .get();

    return events.value.map((event: any) => ({
      id: event.id,
      summary: event.subject,
      description: event.bodyPreview,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      status: event.isCancelled ? 'cancelled' : 'confirmed',
      attendees: event.attendees?.map((att: any) => ({
        email: att.emailAddress.address,
        status: att.status?.response
      })),
      reminders: event.isReminderOn ? [{ minutes: event.reminderMinutesBeforeStart }] : []
    }));
  }

  private async syncEventToProvider(event: any, connection: any): Promise<void> {
    switch (connection.provider) {
      case 'google':
        await this.syncToGoogle(event, connection);
        break;
      case 'outlook':
        await this.syncToOutlook(event, connection);
        break;
    }

    await db('calendar_events')
      .where('id', event.id)
      .update({
        sync_status: 'synced',
        last_synced_at: new Date()
      });
  }

  private async syncToGoogle(event: any, connection: any): Promise<void> {
    this.googleOAuth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
    
    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: new Date(event.start_time).toISOString(),
        timeZone: event.timezone
      },
      end: {
        dateTime: new Date(event.end_time).toISOString(),
        timeZone: event.timezone
      },
      attendees: JSON.parse(event.attendees || '[]'),
      reminders: {
        useDefault: false,
        overrides: JSON.parse(event.reminders || '[]')
      }
    };

    const response = await calendar.events.insert({
      calendarId: connection.calendar_id || 'primary',
      requestBody: googleEvent
    });

    await db('calendar_events')
      .where('id', event.id)
      .update({ external_id: response.data.id });
  }

  private async syncToOutlook(event: any, connection: any): Promise<void> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, connection.access_token);
      }
    });

    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      start: {
        dateTime: new Date(event.start_time).toISOString(),
        timeZone: event.timezone
      },
      end: {
        dateTime: new Date(event.end_time).toISOString(),
        timeZone: event.timezone
      },
      location: {
        displayName: event.location || ''
      },
      attendees: JSON.parse(event.attendees || '[]').map((att: any) => ({
        emailAddress: { address: att.email, name: att.name },
        type: 'required'
      }))
    };

    const response = await client
      .api('/me/calendar/events')
      .post(outlookEvent);

    await db('calendar_events')
      .where('id', event.id)
      .update({ external_id: response.id });
  }

  private async updateProviderEvent(event: any, connection: any): Promise<void> {
    // Implementation depends on provider
    // Similar to sync but using update/patch endpoints
  }

  private async cancelProviderEvent(event: any, connection: any): Promise<void> {
    switch (connection.provider) {
      case 'google':
        this.googleOAuth2Client.setCredentials({
          access_token: connection.access_token,
          refresh_token: connection.refresh_token
        });

        const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
        await calendar.events.delete({
          calendarId: connection.calendar_id || 'primary',
          eventId: event.external_id
        });
        break;

      case 'outlook':
        const client = Client.init({
          authProvider: (done) => {
            done(null, connection.access_token);
          }
        });

        await client
          .api(`/me/calendar/events/${event.external_id}`)
          .delete();
        break;
    }
  }

  private async sendCalendarInvitations(event: any): Promise<void> {
    const attendees = JSON.parse(event.attendees || '[]');
    const calendar = ical({ name: 'Judge.ca Legal Consultation' });

    const calEvent: ICalEventData = {
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      summary: event.title,
      description: event.description,
      location: event.location,
      url: event.meeting_url,
      organizer: {
        name: 'Judge.ca',
        email: 'noreply@judge.ca'
      },
      attendees: attendees.map((att: any) => ({
        email: att.email,
        name: att.name
      }))
    };

    calendar.createEvent(calEvent);

    // Send email with .ics attachment
    for (const attendee of attendees) {
      await this.sendEmailWithCalendarInvite(
        attendee.email,
        event.title,
        calendar.toString()
      );
    }
  }

  private async sendEventUpdateNotifications(event: any): Promise<void> {
    // Send update emails to attendees
    const attendees = JSON.parse(event.attendees || '[]');
    for (const attendee of attendees) {
      await this.sendUpdateEmail(attendee.email, event);
    }
  }

  private async sendCancellationNotifications(event: any, reason?: string): Promise<void> {
    // Send cancellation emails to attendees
    const attendees = JSON.parse(event.attendees || '[]');
    for (const attendee of attendees) {
      await this.sendCancellationEmail(attendee.email, event, reason);
    }
  }

  private async getWorkingHours(userId: string, userType: 'user' | 'attorney'): Promise<any> {
    // Get from attorney preferences or default
    const preferences = await db('attorney_consultation_preferences')
      .where('attorney_id', userId)
      .first();

    return preferences?.working_hours || {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    };
  }

  private generateDayAvailability(
    date: Date,
    workingHours: any,
    bookedEvents: any[],
    duration: number
  ): Array<{ start: string; end: string; isAvailable: boolean }> {
    const slots: Array<{ start: string; end: string; isAvailable: boolean }> = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      if (slotEnd <= endTime) {
        const isBooked = bookedEvents.some(event => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          return (currentTime < eventEnd && slotEnd > eventStart);
        });

        slots.push({
          start: currentTime.toTimeString().substring(0, 5),
          end: slotEnd.toTimeString().substring(0, 5),
          isAvailable: !isBooked
        });
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute intervals
    }

    return slots;
  }

  private async sendEmailWithCalendarInvite(email: string, subject: string, icsContent: string): Promise<void> {
    // Mock implementation - in production, use email service
    console.log(`Sending calendar invite to ${email}: ${subject}`);
  }

  private async sendUpdateEmail(email: string, event: any): Promise<void> {
    // Mock implementation
    console.log(`Sending update email to ${email} for event ${event.id}`);
  }

  private async sendCancellationEmail(email: string, event: any, reason?: string): Promise<void> {
    // Mock implementation
    console.log(`Sending cancellation email to ${email} for event ${event.id}`);
  }

  private transformCalendarEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      externalId: event.external_id,
      provider: event.provider,
      userId: event.user_id,
      userType: event.user_type,
      consultationId: event.consultation_id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.start_time,
      endTime: event.end_time,
      timezone: event.timezone,
      attendees: JSON.parse(event.attendees || '[]'),
      reminders: JSON.parse(event.reminders || '[]'),
      status: event.status,
      isAllDay: event.is_all_day,
      isBusy: event.is_busy,
      meetingUrl: event.meeting_url,
      syncStatus: event.sync_status,
      lastSyncedAt: event.last_synced_at,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    };
  }

  private transformCalendarConnection(connection: any): CalendarConnection {
    return {
      id: connection.id,
      userId: connection.user_id,
      userType: connection.user_type,
      provider: connection.provider,
      email: connection.email,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenExpiresAt: connection.token_expires_at,
      calendarId: connection.calendar_id,
      isActive: connection.is_active,
      isPrimary: connection.is_primary,
      syncEnabled: connection.sync_enabled,
      lastSyncedAt: connection.last_synced_at,
      createdAt: connection.created_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  calendar_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, email)
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'other')),
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  consultation_id UUID REFERENCES video_consultations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Montreal',
  attendees JSONB DEFAULT '[]',
  reminders JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  is_all_day BOOLEAN DEFAULT FALSE,
  is_busy BOOLEAN DEFAULT TRUE,
  meeting_url VARCHAR(500),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  last_synced_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id, user_type);
CREATE INDEX idx_calendar_connections_active ON calendar_connections(is_active);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id, user_type);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_external ON calendar_events(external_id);
CREATE INDEX idx_calendar_events_consultation ON calendar_events(consultation_id);
*/