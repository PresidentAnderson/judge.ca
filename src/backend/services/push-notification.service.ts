import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import apn from 'apn';
import { Expo } from 'expo-server-sdk';

interface PushNotification {
  id: string;
  userId: string;
  userType: 'user' | 'attorney';
  title: string;
  body: string;
  data?: any;
  platform: 'ios' | 'android' | 'web';
  deviceToken?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  priority: 'high' | 'normal' | 'low';
  category: 'message' | 'appointment' | 'match' | 'payment' | 'system' | 'marketing';
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

interface DeviceRegistration {
  id: string;
  userId: string;
  userType: 'user' | 'attorney';
  platform: 'ios' | 'android' | 'web';
  deviceToken: string;
  deviceId: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

interface NotificationPreferences {
  userId: string;
  userType: 'user' | 'attorney';
  messages: boolean;
  appointments: boolean;
  matches: boolean;
  payments: boolean;
  marketing: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
  language: 'en' | 'fr';
}

export class PushNotificationService {
  private firebaseApp: admin.app.App;
  private apnProvider: apn.Provider;
  private expo: Expo;

  constructor() {
    // Initialize Firebase Admin SDK
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });

    // Initialize APN Provider for iOS
    this.apnProvider = new apn.Provider({
      token: {
        key: process.env.APN_KEY,
        keyId: process.env.APN_KEY_ID,
        teamId: process.env.APN_TEAM_ID
      },
      production: process.env.NODE_ENV === 'production'
    });

    // Initialize Expo SDK for React Native
    this.expo = new Expo();
  }

  async registerDevice(
    userId: string,
    userType: 'user' | 'attorney',
    deviceInfo: {
      platform: 'ios' | 'android' | 'web';
      deviceToken: string;
      deviceId: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ): Promise<DeviceRegistration> {
    try {
      // Check if device already registered
      const existingDevice = await db('push_device_registrations')
        .where('device_id', deviceInfo.deviceId)
        .where('user_id', userId)
        .first();

      if (existingDevice) {
        // Update existing registration
        await db('push_device_registrations')
          .where('id', existingDevice.id)
          .update({
            device_token: deviceInfo.deviceToken,
            is_active: true,
            last_active_at: new Date(),
            updated_at: new Date()
          });

        return this.transformDeviceRegistration(existingDevice);
      }

      // Create new registration
      const registrationData = {
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        platform: deviceInfo.platform,
        device_token: deviceInfo.deviceToken,
        device_id: deviceInfo.deviceId,
        device_model: deviceInfo.deviceModel,
        os_version: deviceInfo.osVersion,
        app_version: deviceInfo.appVersion,
        is_active: true,
        last_active_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const [device] = await db('push_device_registrations')
        .insert(registrationData)
        .returning('*');

      // Create default notification preferences
      await this.createDefaultPreferences(userId, userType);

      return this.transformDeviceRegistration(device);
    } catch (error) {
      console.error('Error registering device:', error);
      throw new Error('Failed to register device');
    }
  }

  async sendNotification(
    userId: string,
    userType: 'user' | 'attorney',
    notification: {
      title: string;
      body: string;
      data?: any;
      category: 'message' | 'appointment' | 'match' | 'payment' | 'system' | 'marketing';
      priority?: 'high' | 'normal' | 'low';
      scheduledFor?: Date;
    }
  ): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId, userType);
      if (!this.shouldSendNotification(preferences, notification.category)) {
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Schedule for later
        notification.scheduledFor = this.getNextAvailableTime(preferences);
      }

      // Get active devices
      const devices = await db('push_device_registrations')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_active', true);

      if (devices.length === 0) {
        console.log(`No active devices for user ${userId}`);
        return;
      }

      // Create notification record
      const notificationId = uuidv4();
      const notificationData = {
        id: notificationId,
        user_id: userId,
        user_type: userType,
        title: notification.title,
        body: notification.body,
        data: JSON.stringify(notification.data || {}),
        category: notification.category,
        priority: notification.priority || 'normal',
        scheduled_for: notification.scheduledFor,
        status: notification.scheduledFor ? 'scheduled' : 'pending',
        created_at: new Date()
      };

      await db('push_notifications').insert(notificationData);

      // Send immediately if not scheduled
      if (!notification.scheduledFor) {
        await this.sendToDevices(notificationId, devices, notification);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  async sendBulkNotifications(
    userIds: Array<{ userId: string; userType: 'user' | 'attorney' }>,
    notification: {
      title: string;
      body: string;
      data?: any;
      category: 'message' | 'appointment' | 'match' | 'payment' | 'system' | 'marketing';
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<void> {
    try {
      // Process in batches to avoid overwhelming the system
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(({ userId, userType }) =>
            this.sendNotification(userId, userType, notification)
          )
        );
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw new Error('Failed to send bulk notifications');
    }
  }

  async updateNotificationPreferences(
    userId: string,
    userType: 'user' | 'attorney',
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const existingPrefs = await db('push_notification_preferences')
        .where('user_id', userId)
        .where('user_type', userType)
        .first();

      if (existingPrefs) {
        await db('push_notification_preferences')
          .where('id', existingPrefs.id)
          .update({
            ...preferences,
            updated_at: new Date()
          });
      } else {
        await db('push_notification_preferences').insert({
          id: uuidv4(),
          user_id: userId,
          user_type: userType,
          ...this.getDefaultPreferences(),
          ...preferences,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      const updated = await db('push_notification_preferences')
        .where('user_id', userId)
        .where('user_type', userType)
        .first();

      return this.transformPreferences(updated);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await db('push_notifications')
        .where('id', notificationId)
        .update({
          status: 'read',
          read_at: new Date(),
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async getNotificationHistory(
    userId: string,
    userType: 'user' | 'attorney',
    filters: {
      category?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ notifications: PushNotification[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db('push_notifications')
        .where('user_id', userId)
        .where('user_type', userType);

      if (filters.category) {
        query = query.where('category', filters.category);
      }

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      const notifications = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await query.clone().count('* as count').first();

      return {
        notifications: notifications.map(n => this.transformNotification(n)),
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw new Error('Failed to get notification history');
    }
  }

  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await db('push_notifications')
        .where('status', 'scheduled')
        .where('scheduled_for', '<=', new Date())
        .limit(100);

      for (const notification of scheduledNotifications) {
        const devices = await db('push_device_registrations')
          .where('user_id', notification.user_id)
          .where('user_type', notification.user_type)
          .where('is_active', true);

        if (devices.length > 0) {
          await this.sendToDevices(notification.id, devices, {
            title: notification.title,
            body: notification.body,
            data: JSON.parse(notification.data || '{}'),
            category: notification.category,
            priority: notification.priority
          });
        }

        // Update status
        await db('push_notifications')
          .where('id', notification.id)
          .update({
            status: devices.length > 0 ? 'sent' : 'failed',
            sent_at: new Date(),
            updated_at: new Date()
          });
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  private async sendToDevices(
    notificationId: string,
    devices: any[],
    notification: {
      title: string;
      body: string;
      data?: any;
      category: string;
      priority?: string;
    }
  ): Promise<void> {
    const results = await Promise.allSettled(
      devices.map(device => this.sendToDevice(device, notification))
    );

    // Update notification status based on results
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount > 0) {
      await db('push_notifications')
        .where('id', notificationId)
        .update({
          status: 'sent',
          sent_at: new Date(),
          updated_at: new Date()
        });
    } else {
      await db('push_notifications')
        .where('id', notificationId)
        .update({
          status: 'failed',
          error_message: 'Failed to send to all devices',
          updated_at: new Date()
        });
    }
  }

  private async sendToDevice(device: any, notification: any): Promise<void> {
    try {
      switch (device.platform) {
        case 'ios':
          await this.sendToIOS(device.device_token, notification);
          break;
        case 'android':
          await this.sendToAndroid(device.device_token, notification);
          break;
        case 'web':
          await this.sendToWeb(device.device_token, notification);
          break;
      }

      // Update device last active
      await db('push_device_registrations')
        .where('id', device.id)
        .update({
          last_active_at: new Date(),
          updated_at: new Date()
        });
    } catch (error) {
      console.error(`Error sending to device ${device.id}:`, error);
      
      // Mark device as inactive if token is invalid
      if (this.isTokenError(error)) {
        await db('push_device_registrations')
          .where('id', device.id)
          .update({
            is_active: false,
            updated_at: new Date()
          });
      }
      
      throw error;
    }
  }

  private async sendToIOS(deviceToken: string, notification: any): Promise<void> {
    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    note.badge = 1;
    note.sound = 'ping.aiff';
    note.alert = {
      title: notification.title,
      body: notification.body
    };
    note.payload = notification.data || {};
    note.topic = process.env.IOS_BUNDLE_ID;
    note.priority = notification.priority === 'high' ? 10 : 5;
    note.pushType = 'alert';
    note.category = notification.category;

    await this.apnProvider.send(note, deviceToken);
  }

  private async sendToAndroid(deviceToken: string, notification: any): Promise<void> {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          clickAction: `OPEN_${notification.category.toUpperCase()}`
        }
      }
    };

    await this.firebaseApp.messaging().send(message);
  }

  private async sendToWeb(deviceToken: string, notification: any): Promise<void> {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: notification.priority === 'high'
        }
      }
    };

    await this.firebaseApp.messaging().send(message);
  }

  private async getUserPreferences(userId: string, userType: 'user' | 'attorney'): Promise<NotificationPreferences> {
    const preferences = await db('push_notification_preferences')
      .where('user_id', userId)
      .where('user_type', userType)
      .first();

    return preferences ? this.transformPreferences(preferences) : this.getDefaultPreferences();
  }

  private shouldSendNotification(preferences: NotificationPreferences, category: string): boolean {
    switch (category) {
      case 'message':
        return preferences.messages;
      case 'appointment':
        return preferences.appointments;
      case 'match':
        return preferences.matches;
      case 'payment':
        return preferences.payments;
      case 'marketing':
        return preferences.marketing;
      case 'system':
        return true; // Always send system notifications
      default:
        return true;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursEnabled || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private getNextAvailableTime(preferences: NotificationPreferences): Date {
    if (!preferences.quietHoursEnd) {
      return new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours later
    }

    const now = new Date();
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    const nextTime = new Date(now);
    nextTime.setHours(endHour, endMinute, 0, 0);
    
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private isTokenError(error: any): boolean {
    const tokenErrors = [
      'InvalidRegistration',
      'NotRegistered',
      'InvalidToken',
      'Unregistered'
    ];
    
    return tokenErrors.some(errType => 
      error.message?.includes(errType) || 
      error.code?.includes(errType)
    );
  }

  private async createDefaultPreferences(userId: string, userType: 'user' | 'attorney'): Promise<void> {
    const existing = await db('push_notification_preferences')
      .where('user_id', userId)
      .where('user_type', userType)
      .first();

    if (!existing) {
      await db('push_notification_preferences').insert({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        ...this.getDefaultPreferences(),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  private getDefaultPreferences(): any {
    return {
      messages: true,
      appointments: true,
      matches: true,
      payments: true,
      marketing: false,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      language: 'en'
    };
  }

  private transformNotification(notification: any): PushNotification {
    return {
      id: notification.id,
      userId: notification.user_id,
      userType: notification.user_type,
      title: notification.title,
      body: notification.body,
      data: JSON.parse(notification.data || '{}'),
      platform: notification.platform,
      deviceToken: notification.device_token,
      status: notification.status,
      priority: notification.priority,
      category: notification.category,
      scheduledFor: notification.scheduled_for,
      sentAt: notification.sent_at,
      deliveredAt: notification.delivered_at,
      readAt: notification.read_at,
      errorMessage: notification.error_message,
      createdAt: notification.created_at
    };
  }

  private transformDeviceRegistration(device: any): DeviceRegistration {
    return {
      id: device.id,
      userId: device.user_id,
      userType: device.user_type,
      platform: device.platform,
      deviceToken: device.device_token,
      deviceId: device.device_id,
      deviceModel: device.device_model,
      osVersion: device.os_version,
      appVersion: device.app_version,
      isActive: device.is_active,
      lastActiveAt: device.last_active_at,
      createdAt: device.created_at
    };
  }

  private transformPreferences(prefs: any): NotificationPreferences {
    return {
      userId: prefs.user_id,
      userType: prefs.user_type,
      messages: prefs.messages,
      appointments: prefs.appointments,
      matches: prefs.matches,
      payments: prefs.payments,
      marketing: prefs.marketing,
      quietHoursEnabled: prefs.quiet_hours_enabled,
      quietHoursStart: prefs.quiet_hours_start,
      quietHoursEnd: prefs.quiet_hours_end,
      language: prefs.language
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE push_device_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_token TEXT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_model VARCHAR(255),
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, user_id)
);

CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  platform VARCHAR(20),
  device_token TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'delivered', 'read')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('message', 'appointment', 'match', 'payment', 'system', 'marketing')),
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE push_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  messages BOOLEAN DEFAULT TRUE,
  appointments BOOLEAN DEFAULT TRUE,
  matches BOOLEAN DEFAULT TRUE,
  payments BOOLEAN DEFAULT TRUE,
  marketing BOOLEAN DEFAULT FALSE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_type)
);

CREATE INDEX idx_push_device_registrations_user ON push_device_registrations(user_id, user_type);
CREATE INDEX idx_push_device_registrations_active ON push_device_registrations(is_active);
CREATE INDEX idx_push_notifications_user ON push_notifications(user_id, user_type);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
CREATE INDEX idx_push_notifications_scheduled ON push_notifications(scheduled_for);
CREATE INDEX idx_push_notification_preferences_user ON push_notification_preferences(user_id, user_type);
*/