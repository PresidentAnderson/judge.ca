import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

interface TrackingEvent {
  event: string;
  properties?: {
    [key: string]: any;
  };
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  page?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  category?: string;
  serverTimestamp?: string;
}

interface EventValidation {
  isValid: boolean;
  errors: string[];
}

// Event validation rules
const validateEvent = (event: TrackingEvent): EventValidation => {
  const errors: string[] = [];

  if (!event.event || typeof event.event !== 'string') {
    errors.push('Event name is required and must be a string');
  }

  if (event.event && event.event.length > 100) {
    errors.push('Event name must be less than 100 characters');
  }

  if (event.properties) {
    if (typeof event.properties !== 'object') {
      errors.push('Properties must be an object');
    } else {
      // Check for sensitive data
      const sensitiveKeys = ['password', 'ssn', 'credit_card', 'social_insurance_number'];
      for (const key of Object.keys(event.properties)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          errors.push(`Potentially sensitive property detected: ${key}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Legal-specific event mappings
const legalEventCategories = {
  'consultation_request_started': 'lead_generation',
  'consultation_request_completed': 'conversion',
  'attorney_profile_viewed': 'engagement',
  'payment_completed': 'revenue',
  'user_signup': 'acquisition',
  'attorney_signup': 'attorney_acquisition',
  'review_submitted': 'user_feedback',
  'legal_guide_viewed': 'content_engagement',
  'error_occurred': 'technical',
  'page_view': 'navigation'
};

// Store events in memory for demonstration (use database in production)
const eventStore: TrackingEvent[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventData: TrackingEvent = req.body;

    // Validate the event
    const validation = validateEvent(eventData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid event data',
        details: validation.errors
      });
    }

    // Enrich event with server-side data
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    
    const enrichedEvent: TrackingEvent = {
      ...eventData,
      timestamp: eventData.timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: clientIp || req.socket.remoteAddress || 'unknown',
      referrer: req.headers.referer || 'direct',
      category: legalEventCategories[eventData.event as keyof typeof legalEventCategories] || 'other',
      serverTimestamp: new Date().toISOString()
    };

    // Store event (in production, send to analytics services)
    eventStore.push(enrichedEvent);

    // Keep only last 1000 events in memory
    if (eventStore.length > 1000) {
      eventStore.splice(0, eventStore.length - 1000);
    }

    // Process different event types
    switch (eventData.event) {
      case 'consultation_request_completed':
        await handleConsultationConversion(enrichedEvent);
        break;
      case 'payment_completed':
        await handlePaymentEvent(enrichedEvent);
        break;
      case 'error_occurred':
        await handleErrorEvent(enrichedEvent);
        break;
      case 'attorney_verification_completed':
        await handleAttorneyVerification(enrichedEvent);
        break;
      default:
        // Standard event processing
        break;
    }

    // Send to external analytics services (in production)
    await sendToAnalyticsServices(enrichedEvent);

    // Log important events
    if (['consultation_request_completed', 'payment_completed', 'error_occurred'].includes(eventData.event)) {
      console.log(`Important event tracked: ${eventData.event}`, {
        userId: eventData.userId,
        properties: eventData.properties
      });
    }

    res.status(200).json({
      success: true,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Event tracking error:', error);
    
    Sentry.captureException(error, {
      tags: {
        section: 'analytics',
        endpoint: 'track'
      },
      extra: {
        body: req.body,
        headers: req.headers
      }
    });

    res.status(500).json({
      error: 'Failed to track event',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
}

// Handle consultation conversion events
async function handleConsultationConversion(event: TrackingEvent) {
  try {
    // In production, you would:
    // 1. Update conversion metrics in database
    // 2. Trigger marketing attribution
    // 3. Send to CRM system
    // 4. Calculate commission for attorneys
    
    console.log('Consultation conversion tracked:', {
      userId: event.userId,
      legalArea: event.properties?.legal_area,
      value: event.properties?.value
    });

    // Track high-value conversions
    if (event.properties?.value && event.properties.value > 500) {
      Sentry.addBreadcrumb({
        message: 'High-value consultation conversion',
        category: 'business',
        data: {
          value: event.properties.value,
          userId: event.userId
        },
        level: 'info'
      });
    }
  } catch (error) {
    console.error('Failed to handle consultation conversion:', error);
    Sentry.captureException(error);
  }
}

// Handle payment events
async function handlePaymentEvent(event: TrackingEvent) {
  try {
    // In production, you would:
    // 1. Update revenue metrics
    // 2. Send to accounting system
    // 3. Trigger receipt generation
    // 4. Update attorney payouts
    
    console.log('Payment event tracked:', {
      userId: event.userId,
      amount: event.properties?.amount,
      currency: event.properties?.currency || 'CAD'
    });

  } catch (error) {
    console.error('Failed to handle payment event:', error);
    Sentry.captureException(error);
  }
}

// Handle error events
async function handleErrorEvent(event: TrackingEvent) {
  try {
    // Send error to Sentry with additional context
    const error = new Error(event.properties?.error_message || 'Tracked error event');
    
    Sentry.captureException(error, {
      tags: {
        source: 'client_tracking',
        page: event.page,
        category: event.properties?.error_category
      },
      user: {
        id: event.userId
      },
      extra: event.properties
    });

    // Check for critical errors that need immediate attention
    const criticalErrors = ['payment_failed', 'consultation_booking_failed', 'attorney_verification_failed'];
    if (criticalErrors.some(critical => event.properties?.error_type?.includes(critical))) {
      // In production, send alerts to team
      console.error('Critical error detected:', event.properties);
    }

  } catch (error) {
    console.error('Failed to handle error event:', error);
  }
}

// Handle attorney verification events
async function handleAttorneyVerification(event: TrackingEvent) {
  try {
    // In production, you would:
    // 1. Update attorney status in database
    // 2. Send welcome email
    // 3. Enable profile visibility
    // 4. Notify admin team
    
    console.log('Attorney verification completed:', {
      attorneyId: event.properties?.attorney_id,
      specialization: event.properties?.specialization
    });

  } catch (error) {
    console.error('Failed to handle attorney verification:', error);
    Sentry.captureException(error);
  }
}

// Send events to external analytics services
async function sendToAnalyticsServices(event: TrackingEvent) {
  try {
    // In production, send to:
    // 1. Google Analytics 4 via Measurement Protocol
    // 2. Facebook Conversions API
    // 3. Internal data warehouse
    // 4. Business intelligence tools
    
    // For now, just log that we would send the event
    console.log('Would send to analytics services:', {
      event: event.event,
      category: event.category,
      timestamp: event.timestamp
    });

  } catch (error) {
    console.error('Failed to send to analytics services:', error);
    // Don't throw error to avoid blocking the main tracking flow
    Sentry.captureException(error);
  }
}

// Export event store for analytics dashboard
export { eventStore };