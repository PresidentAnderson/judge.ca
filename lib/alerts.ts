import * as Sentry from '@sentry/nextjs';

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert types for legal platform
export enum AlertType {
  SYSTEM_ERROR = 'system_error',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  SECURITY_INCIDENT = 'security_incident',
  HIGH_ERROR_RATE = 'high_error_rate',
  DATABASE_ISSUE = 'database_issue',
  PAYMENT_FAILURE = 'payment_failure',
  CONSULTATION_BOOKING_FAILURE = 'consultation_booking_failure',
  ATTORNEY_VERIFICATION_ISSUE = 'attorney_verification_issue',
  HIGH_MEMORY_USAGE = 'high_memory_usage',
  SLOW_RESPONSE_TIME = 'slow_response_time',
  API_RATE_LIMIT_EXCEEDED = 'api_rate_limit_exceeded',
  CERTIFICATE_EXPIRING = 'certificate_expiring'
}

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  metadata?: any;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface AlertConfig {
  enabled: boolean;
  severity: AlertSeverity;
  channels: AlertChannel[];
  throttle: number; // Minutes to wait before sending same alert again
  conditions?: {
    threshold?: number;
    duration?: number; // Minutes
    occurrences?: number;
  };
}

enum AlertChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  SENTRY = 'sentry'
}

// Alert configuration for different types
const ALERT_CONFIGS: Record<AlertType, AlertConfig> = {
  [AlertType.SYSTEM_ERROR]: {
    enabled: true,
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.SENTRY],
    throttle: 5
  },
  [AlertType.PERFORMANCE_DEGRADATION]: {
    enabled: true,
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 15,
    conditions: { threshold: 2000, duration: 5 } // 2s response time for 5 minutes
  },
  [AlertType.SECURITY_INCIDENT]: {
    enabled: true,
    severity: AlertSeverity.CRITICAL,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.SMS, AlertChannel.SENTRY],
    throttle: 0 // No throttling for security incidents
  },
  [AlertType.HIGH_ERROR_RATE]: {
    enabled: true,
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 10,
    conditions: { threshold: 5, duration: 5 } // >5% error rate for 5 minutes
  },
  [AlertType.DATABASE_ISSUE]: {
    enabled: true,
    severity: AlertSeverity.CRITICAL,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.SENTRY],
    throttle: 2
  },
  [AlertType.PAYMENT_FAILURE]: {
    enabled: true,
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 1,
    conditions: { occurrences: 3 } // 3 payment failures
  },
  [AlertType.CONSULTATION_BOOKING_FAILURE]: {
    enabled: true,
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 5,
    conditions: { occurrences: 2 } // 2 booking failures
  },
  [AlertType.ATTORNEY_VERIFICATION_ISSUE]: {
    enabled: true,
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.EMAIL],
    throttle: 30
  },
  [AlertType.HIGH_MEMORY_USAGE]: {
    enabled: true,
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 30,
    conditions: { threshold: 85, duration: 10 } // >85% memory for 10 minutes
  },
  [AlertType.SLOW_RESPONSE_TIME]: {
    enabled: true,
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.EMAIL],
    throttle: 15,
    conditions: { threshold: 3000, duration: 10 } // >3s response time for 10 minutes
  },
  [AlertType.API_RATE_LIMIT_EXCEEDED]: {
    enabled: true,
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 10
  },
  [AlertType.CERTIFICATE_EXPIRING]: {
    enabled: true,
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    throttle: 1440 // 24 hours
  }
};

// In-memory alert store (use Redis or database in production)
const activeAlerts: Map<string, Alert> = new Map();
const alertHistory: Alert[] = [];
const alertThrottles: Map<string, Date> = new Map();

class AlertManager {
  
  // Trigger an alert
  async triggerAlert(
    type: AlertType,
    message: string,
    metadata?: any,
    source = 'judge.ca'
  ): Promise<void> {
    const config = ALERT_CONFIGS[type];
    
    if (!config.enabled) {
      console.log(`Alert type ${type} is disabled, skipping`);
      return;
    }

    // Check throttling
    const throttleKey = `${type}_${source}`;
    const lastSent = alertThrottles.get(throttleKey);
    const now = new Date();
    
    if (lastSent && config.throttle > 0) {
      const minutesSinceLastAlert = (now.getTime() - lastSent.getTime()) / (1000 * 60);
      if (minutesSinceLastAlert < config.throttle) {
        console.log(`Alert ${type} throttled, last sent ${minutesSinceLastAlert.toFixed(1)} minutes ago`);
        return;
      }
    }

    // Create alert
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: config.severity,
      title: this.getAlertTitle(type),
      message,
      timestamp: now,
      source,
      metadata
    };

    // Store alert
    activeAlerts.set(alert.id, alert);
    alertHistory.push(alert);
    alertThrottles.set(throttleKey, now);

    // Send to configured channels
    await this.sendAlert(alert, config);

    console.log(`Alert triggered: ${type} - ${message}`);
  }

  // Send alert to configured channels
  private async sendAlert(alert: Alert, config: AlertConfig): Promise<void> {
    const promises = config.channels.map(channel => {
      switch (channel) {
        case AlertChannel.EMAIL:
          return this.sendEmailAlert(alert);
        case AlertChannel.SLACK:
          return this.sendSlackAlert(alert);
        case AlertChannel.SMS:
          return this.sendSMSAlert(alert);
        case AlertChannel.WEBHOOK:
          return this.sendWebhookAlert(alert);
        case AlertChannel.SENTRY:
          return this.sendSentryAlert(alert);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to send some alerts:', error);
      Sentry.captureException(error);
    }
  }

  // Email alert
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      // In production, integrate with your email service
      const emailData = {
        to: process.env.ALERT_EMAIL || 'admin@judge.ca',
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: this.generateEmailHTML(alert)
      };

      console.log('Would send email alert:', emailData.subject);
      
      // Simulate email sending
      // await emailService.send(emailData);
    } catch (error) {
      console.error('Failed to send email alert:', error);
      Sentry.captureException(error);
    }
  }

  // Slack alert
  private async sendSlackAlert(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        console.log('Slack webhook URL not configured, skipping Slack alert');
        return;
      }

      const slackMessage = {
        text: `🚨 ${alert.title}`,
        attachments: [
          {
            color: this.getSeverityColor(alert.severity),
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true
              },
              {
                title: 'Source',
                value: alert.source,
                short: true
              },
              {
                title: 'Message',
                value: alert.message,
                short: false
              },
              {
                title: 'Time',
                value: alert.timestamp.toISOString(),
                short: true
              }
            ]
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      console.log('Slack alert sent successfully');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      Sentry.captureException(error);
    }
  }

  // SMS alert (for critical alerts)
  private async sendSMSAlert(alert: Alert): Promise<void> {
    try {
      const phoneNumber = process.env.ALERT_PHONE;
      if (!phoneNumber) {
        console.log('Alert phone number not configured, skipping SMS alert');
        return;
      }

      const message = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`;
      
      console.log('Would send SMS alert to:', phoneNumber);
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // await smsService.send(phoneNumber, message);
    } catch (error) {
      console.error('Failed to send SMS alert:', error);
      Sentry.captureException(error);
    }
  }

  // Webhook alert
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (!webhookUrl) {
        console.log('Alert webhook URL not configured, skipping webhook alert');
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      console.log('Webhook alert sent successfully');
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
      Sentry.captureException(error);
    }
  }

  // Sentry alert
  private async sendSentryAlert(alert: Alert): Promise<void> {
    try {
      Sentry.captureMessage(alert.message, {
        level: this.getSentryLevel(alert.severity),
        tags: {
          alert_type: alert.type,
          alert_id: alert.id,
          source: alert.source
        },
        extra: {
          alert,
          metadata: alert.metadata
        }
      });

      console.log('Sentry alert sent successfully');
    } catch (error) {
      console.error('Failed to send Sentry alert:', error);
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy = 'system'): Promise<void> {
    const alert = activeAlerts.get(alertId);
    if (!alert) {
      console.warn(`Alert ${alertId} not found`);
      return;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    activeAlerts.delete(alertId);

    console.log(`Alert resolved: ${alert.type} by ${resolvedBy}`);
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(activeAlerts.values());
  }

  // Get alert history
  getAlertHistory(limit = 100): Alert[] {
    return alertHistory.slice(-limit);
  }

  // Get alert title based on type
  private getAlertTitle(type: AlertType): string {
    const titles = {
      [AlertType.SYSTEM_ERROR]: 'System Error Detected',
      [AlertType.PERFORMANCE_DEGRADATION]: 'Performance Degradation',
      [AlertType.SECURITY_INCIDENT]: 'Security Incident',
      [AlertType.HIGH_ERROR_RATE]: 'High Error Rate Detected',
      [AlertType.DATABASE_ISSUE]: 'Database Issue',
      [AlertType.PAYMENT_FAILURE]: 'Payment Processing Failure',
      [AlertType.CONSULTATION_BOOKING_FAILURE]: 'Consultation Booking Failure',
      [AlertType.ATTORNEY_VERIFICATION_ISSUE]: 'Attorney Verification Issue',
      [AlertType.HIGH_MEMORY_USAGE]: 'High Memory Usage',
      [AlertType.SLOW_RESPONSE_TIME]: 'Slow Response Time',
      [AlertType.API_RATE_LIMIT_EXCEEDED]: 'API Rate Limit Exceeded',
      [AlertType.CERTIFICATE_EXPIRING]: 'SSL Certificate Expiring'
    };

    return titles[type] || 'System Alert';
  }

  // Get severity color for Slack
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      [AlertSeverity.LOW]: '#36a64f', // Green
      [AlertSeverity.MEDIUM]: '#ff9500', // Orange
      [AlertSeverity.HIGH]: '#ff0000', // Red
      [AlertSeverity.CRITICAL]: '#8b0000' // Dark Red
    };

    return colors[severity] || '#808080';
  }

  // Get Sentry level from severity
  private getSentryLevel(severity: AlertSeverity): 'info' | 'warning' | 'error' | 'fatal' {
    const levels = {
      [AlertSeverity.LOW]: 'info' as const,
      [AlertSeverity.MEDIUM]: 'warning' as const,
      [AlertSeverity.HIGH]: 'error' as const,
      [AlertSeverity.CRITICAL]: 'fatal' as const
    };

    return levels[severity] || 'info';
  }

  // Generate email HTML
  private generateEmailHTML(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
            <h1>🚨 ${alert.title}</h1>
            <p style="font-size: 18px; margin: 0;">Severity: ${alert.severity.toUpperCase()}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f5f5f5;">
            <h2>Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">Alert ID:</td>
                <td style="padding: 10px;">${alert.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">Type:</td>
                <td style="padding: 10px;">${alert.type}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">Source:</td>
                <td style="padding: 10px;">${alert.source}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">Time:</td>
                <td style="padding: 10px;">${alert.timestamp.toISOString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Message:</td>
                <td style="padding: 10px;">${alert.message}</td>
              </tr>
            </table>
            
            ${alert.metadata ? `
              <h3>Additional Information</h3>
              <pre style="background-color: #fff; padding: 10px; border: 1px solid #ddd; overflow: auto;">
${JSON.stringify(alert.metadata, null, 2)}
              </pre>
            ` : ''}
          </div>
          
          <div style="padding: 20px; text-align: center; background-color: #e9e9e9;">
            <p style="margin: 0; color: #666;">
              This alert was generated by Judge.ca monitoring system.
              <br>
              <a href="https://judge.ca/admin/alerts" style="color: #007cba;">View Dashboard</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

// Create singleton instance
export const alertManager = new AlertManager();

// Convenience functions for common alerts
export const alerts = {
  systemError: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.SYSTEM_ERROR, message, metadata),
  
  performanceDegradation: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.PERFORMANCE_DEGRADATION, message, metadata),
  
  securityIncident: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.SECURITY_INCIDENT, message, metadata),
  
  highErrorRate: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.HIGH_ERROR_RATE, message, metadata),
  
  databaseIssue: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.DATABASE_ISSUE, message, metadata),
  
  paymentFailure: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.PAYMENT_FAILURE, message, metadata),
  
  consultationBookingFailure: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.CONSULTATION_BOOKING_FAILURE, message, metadata),
  
  attorneyVerificationIssue: (message: string, metadata?: any) => 
    alertManager.triggerAlert(AlertType.ATTORNEY_VERIFICATION_ISSUE, message, metadata)
};

export default alertManager;