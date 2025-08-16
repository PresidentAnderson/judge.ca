import { logger } from '../utils/logger';

interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private subscriptions: Map<string, NotificationSubscription[]> = new Map();

  constructor() {
    logger.info('NotificationService initialized');
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribeUser(userId: string, subscription: NotificationSubscription): Promise<void> {
    try {
      const userSubscriptions = this.subscriptions.get(userId) || [];
      
      // Check if subscription already exists
      const existingIndex = userSubscriptions.findIndex(
        sub => sub.endpoint === subscription.endpoint
      );
      
      if (existingIndex !== -1) {
        userSubscriptions[existingIndex] = subscription;
      } else {
        userSubscriptions.push(subscription);
      }
      
      this.subscriptions.set(userId, userSubscriptions);
      logger.info(`User ${userId} subscribed to push notifications`);
    } catch (error) {
      logger.error('Failed to subscribe user to notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribeUser(userId: string, endpoint?: string): Promise<void> {
    try {
      if (!endpoint) {
        // Remove all subscriptions for user
        this.subscriptions.delete(userId);
        logger.info(`All subscriptions removed for user ${userId}`);
      } else {
        // Remove specific subscription
        const userSubscriptions = this.subscriptions.get(userId) || [];
        const filteredSubscriptions = userSubscriptions.filter(
          sub => sub.endpoint !== endpoint
        );
        
        if (filteredSubscriptions.length === 0) {
          this.subscriptions.delete(userId);
        } else {
          this.subscriptions.set(userId, filteredSubscriptions);
        }
        
        logger.info(`Subscription removed for user ${userId}`);
      }
    } catch (error) {
      logger.error('Failed to unsubscribe user from notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a user
   */
  async sendPushNotification(data: PushNotificationData): Promise<void> {
    try {
      const userSubscriptions = this.subscriptions.get(data.userId);
      
      if (!userSubscriptions || userSubscriptions.length === 0) {
        logger.warn(`No push subscriptions found for user ${data.userId}`);
        return;
      }

      const payload = {
        title: data.title,
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        tag: data.tag || 'notification',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        timestamp: Date.now()
      };

      // In a real implementation, you would use a service like Firebase Cloud Messaging
      // or web-push library to send actual push notifications
      logger.info(`Push notification sent to user ${data.userId}:`, {
        title: data.title,
        body: data.body,
        subscriptions: userSubscriptions.length
      });

      // TODO: Implement actual push notification sending
      // This is a placeholder for the actual implementation
      await this.sendWebPushNotification(userSubscriptions, payload);
      
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotifications(notifications: PushNotificationData[]): Promise<void> {
    try {
      const promises = notifications.map(notification => 
        this.sendPushNotification(notification)
      );
      
      await Promise.allSettled(promises);
      logger.info(`Bulk notifications sent to ${notifications.length} users`);
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<{
    enabled: boolean;
    categories: string[];
    subscriptions: number;
  }> {
    try {
      const userSubscriptions = this.subscriptions.get(userId) || [];
      
      return {
        enabled: userSubscriptions.length > 0,
        categories: ['messages', 'appointments', 'updates'], // Default categories
        subscriptions: userSubscriptions.length
      };
    } catch (error) {
      logger.error('Failed to get user notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: {
      enabled?: boolean;
      categories?: string[];
    }
  ): Promise<void> {
    try {
      if (preferences.enabled === false) {
        await this.unsubscribeUser(userId);
      }
      
      // In a real implementation, you would store these preferences in the database
      logger.info(`Notification preferences updated for user ${userId}:`, preferences);
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send web push notification (placeholder implementation)
   */
  private async sendWebPushNotification(
    subscriptions: NotificationSubscription[], 
    payload: any
  ): Promise<void> {
    // This is a placeholder implementation
    // In production, you would use a library like 'web-push' to send actual notifications
    
    for (const subscription of subscriptions) {
      try {
        // Mock sending notification
        logger.debug('Sending web push notification:', {
          endpoint: subscription.endpoint,
          payload: payload.title
        });
        
        // TODO: Implement actual web push using 'web-push' library
        // webpush.sendNotification(subscription, JSON.stringify(payload));
        
      } catch (error) {
        logger.error('Failed to send notification to subscription:', error);
        // Remove invalid subscription
        // In production, you would remove invalid subscriptions from the database
      }
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSubscriptions: number;
    activeUsers: number;
    sentToday: number;
  }> {
    try {
      const totalSubscriptions = Array.from(this.subscriptions.values())
        .reduce((total, subs) => total + subs.length, 0);
      
      return {
        totalSubscriptions,
        activeUsers: this.subscriptions.size,
        sentToday: 0 // TODO: Implement actual tracking
      };
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }
}