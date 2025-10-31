# Judge.ca Analytics & Monitoring Implementation Guide

## Overview

This document provides comprehensive documentation for the analytics and monitoring system implemented for Judge.ca, a legal consultation platform. The system includes tracking, performance monitoring, error handling, and GDPR-compliant user consent management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Analytics Services](#analytics-services)
3. [Event Tracking](#event-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [Error Tracking & Alerts](#error-tracking--alerts)
6. [GDPR Compliance](#gdpr-compliance)
7. [Dashboard & Reporting](#dashboard--reporting)
8. [Configuration](#configuration)
9. [Usage Examples](#usage-examples)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The analytics system is built with a modular architecture that supports multiple tracking platforms:

```
├── Analytics Core (lib/analytics.ts)
├── Performance Monitoring (lib/performance.ts)
├── Error Tracking & Alerts (lib/alerts.ts)
├── Conversion Tracking (lib/conversions.ts)
├── Consent Management (components/analytics/ConsentManager.tsx)
├── Monitoring Dashboard (components/analytics/MonitoringDashboard.tsx)
├── Custom Hooks (hooks/useAnalytics.ts)
└── API Endpoints (pages/api/analytics/)
```

### Key Components

- **Analytics Service**: Central service for all tracking operations
- **Performance Monitor**: Web Vitals and performance metrics tracking
- **Alert Manager**: Real-time error detection and notification system
- **Conversion Tracker**: E-commerce and goal conversion tracking
- **Consent Manager**: GDPR-compliant user consent interface
- **Monitoring Dashboard**: Real-time system health and analytics dashboard

## Analytics Services

### Supported Platforms

1. **Google Analytics 4 (GA4)**
   - Enhanced ecommerce tracking
   - Custom events for legal consultations
   - User journey analysis
   - Conversion goal tracking

2. **Google Tag Manager (GTM)**
   - Centralized tag management
   - Custom event triggers
   - Data layer management

3. **Facebook Pixel**
   - Conversion tracking
   - Custom audiences
   - iOS 14.5+ compliance

4. **Microsoft Clarity**
   - Heatmaps and session recordings
   - User behavior analysis
   - Privacy-compliant tracking

5. **Vercel Analytics**
   - Performance metrics
   - Speed insights
   - Core Web Vitals

6. **Sentry**
   - Error tracking and monitoring
   - Performance monitoring
   - Release tracking

### Environment Variables

```bash
# Analytics & Monitoring
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=123456789
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxx
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=judge-ca
SENTRY_PROJECT=judge-ca-web
SENTRY_AUTH_TOKEN=xxxxx

# Status Monitoring
STATUSPAGE_PAGE_ID=xxxxx
STATUSPAGE_API_KEY=xxxxx

# Alert Notifications
ALERT_EMAIL=admin@judge.ca
ALERT_PHONE=+1234567890
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

## Event Tracking

### Legal Platform Specific Events

The system tracks events specific to the legal consultation platform:

#### User Registration & Authentication
- `USER_SIGNUP`: New user registration
- `USER_LOGIN`: User login
- `USER_LOGOUT`: User logout

#### Attorney Events
- `ATTORNEY_SIGNUP`: Attorney registration
- `ATTORNEY_PROFILE_COMPLETED`: Profile completion
- `ATTORNEY_VERIFICATION_STARTED`: Verification process started
- `ATTORNEY_VERIFICATION_COMPLETED`: Verification completed

#### Legal Consultation Events
- `CONSULTATION_REQUEST_STARTED`: Consultation request initiated
- `CONSULTATION_REQUEST_COMPLETED`: Consultation request completed
- `CONSULTATION_SCHEDULED`: Consultation scheduled
- `CONSULTATION_CANCELLED`: Consultation cancelled
- `CONSULTATION_COMPLETED`: Consultation completed

#### Search & Matching
- `ATTORNEY_SEARCH_PERFORMED`: Attorney search conducted
- `ATTORNEY_PROFILE_VIEWED`: Attorney profile viewed
- `MATCH_REQUEST_SENT`: Match request sent to attorney
- `MATCH_ACCEPTED`: Attorney accepted match
- `MATCH_DECLINED`: Attorney declined match

#### Payment Events
- `PAYMENT_INITIATED`: Payment process started
- `PAYMENT_COMPLETED`: Payment successful
- `PAYMENT_FAILED`: Payment failed
- `SUBSCRIPTION_STARTED`: Subscription plan started
- `SUBSCRIPTION_CANCELLED`: Subscription cancelled

### Event Implementation Example

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function ConsultationBooking() {
  const { trackConsultationRequest, trackPaymentCompleted } = useAnalytics();

  const handleBooking = async (bookingData) => {
    // Track consultation request
    trackConsultationRequest({
      id: bookingData.id,
      userId: bookingData.userId,
      legalArea: bookingData.legalArea,
      urgency: bookingData.urgency,
      estimatedValue: bookingData.estimatedValue
    });

    // Process booking...
    
    // Track payment completion
    trackPaymentCompleted({
      userId: bookingData.userId,
      amount: bookingData.amount,
      currency: 'CAD',
      paymentMethod: bookingData.paymentMethod,
      transactionId: paymentResult.transactionId,
      consultationId: bookingData.id
    });
  };
}
```

## Performance Monitoring

### Web Vitals Tracking

The system automatically tracks Core Web Vitals:

- **CLS (Cumulative Layout Shift)**: Layout stability
- **FID (First Input Delay)**: Interactivity
- **FCP (First Contentful Paint)**: Loading performance
- **LCP (Largest Contentful Paint)**: Loading performance
- **TTFB (Time to First Byte)**: Server response time

### Performance Thresholds

```typescript
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};
```

### Custom Performance Tracking

```typescript
import { markPerformance, measurePerformance } from '../lib/performance';

// Mark performance points
markPerformance('consultation_search_start');
// ... perform search operation
markPerformance('consultation_search_end');

// Measure performance
measurePerformance('consultation_search_duration', 'consultation_search_start', 'consultation_search_end');
```

### Performance Alerts

The system automatically alerts for:
- Poor Web Vitals scores
- Slow resource loading (>2 seconds)
- High memory usage (>80%)
- Long tasks blocking main thread (>50ms)
- Failed resource loads

## Error Tracking & Alerts

### Alert System

The alert system supports multiple notification channels:

- **Email**: Critical system alerts
- **Slack**: Real-time team notifications
- **SMS**: Critical security incidents
- **Webhook**: Integration with external systems
- **Sentry**: Error aggregation and analysis

### Alert Types

```typescript
enum AlertType {
  SYSTEM_ERROR = 'system_error',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  SECURITY_INCIDENT = 'security_incident',
  HIGH_ERROR_RATE = 'high_error_rate',
  DATABASE_ISSUE = 'database_issue',
  PAYMENT_FAILURE = 'payment_failure',
  CONSULTATION_BOOKING_FAILURE = 'consultation_booking_failure'
}
```

### Alert Configuration

Each alert type has configurable:
- **Severity**: LOW, MEDIUM, HIGH, CRITICAL
- **Channels**: Email, Slack, SMS, Webhook, Sentry
- **Throttling**: Minimum time between same alerts
- **Conditions**: Thresholds and durations

### Example Alert Usage

```typescript
import { alerts } from '../lib/alerts';

// Trigger payment failure alert
await alerts.paymentFailure(
  'Stripe payment failed for consultation booking',
  {
    userId: 'user123',
    consultationId: 'consult456',
    amount: 150,
    error: 'Card declined'
  }
);
```

## GDPR Compliance

### Consent Management

The system includes a comprehensive consent management interface that allows users to:

- Accept or decline different types of tracking
- View detailed information about each tracking type
- Change preferences at any time
- Comply with GDPR requirements

### Consent Categories

1. **Necessary Cookies**: Always active (authentication, security)
2. **Analytics Cookies**: Performance and usage analytics
3. **Marketing Cookies**: Advertising and remarketing
4. **Personalization Cookies**: Customized user experience

### Consent Implementation

```typescript
import ConsentManager from '../components/analytics/ConsentManager';

function App() {
  const handleConsentChange = (consent: boolean) => {
    if (consent) {
      analytics.initialize();
    }
  };

  return (
    <div>
      <ConsentManager onConsentChange={handleConsentChange} />
      {/* App content */}
    </div>
  );
}
```

### Data Privacy Features

- Automatic consent checking before analytics initialization
- IP anonymization for Google Analytics
- Secure storage of consent preferences
- Data export capabilities for GDPR requests
- Automatic data retention policies

## Dashboard & Reporting

### Real-Time Monitoring Dashboard

The dashboard provides:

- **System Health**: Overall system status and uptime
- **Performance Metrics**: Response times, error rates, throughput
- **User Analytics**: Active users, page views, conversions
- **Business Metrics**: Revenue, consultation bookings, attorney signups
- **Error Monitoring**: Real-time error tracking and alerts

### Key Metrics Displayed

1. **Total Users**: Current active user count
2. **Active Consultations**: Ongoing legal consultations
3. **Revenue**: Real-time revenue tracking
4. **Conversion Rate**: Consultation booking conversion rate
5. **Average Response Time**: API response performance
6. **System Health**: Overall system status

### Dashboard API

```typescript
// Fetch dashboard data
const response = await fetch('/api/analytics/dashboard?timeframe=24h');
const dashboardData = await response.json();
```

### Real-Time Activity Feed

The dashboard includes a real-time activity feed showing:
- New user registrations
- Attorney verifications
- Consultation bookings
- Payment processing
- System alerts

## Configuration

### Initial Setup

1. **Install Dependencies**:
   ```bash
   npm install @sentry/nextjs @vercel/analytics gtag react-gtm-module js-cookie react-cookie-consent
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in your analytics credentials.

3. **Initialize Analytics**:
   The analytics system is automatically initialized in `_app.tsx` with consent checking.

4. **Configure Sentry**:
   Sentry is configured with separate files for client, server, and edge environments.

### StatusPage Integration

For uptime monitoring with StatusPage:

1. Create a StatusPage account and page
2. Get your Page ID and API key
3. Configure environment variables:
   ```bash
   STATUSPAGE_PAGE_ID=your_page_id
   STATUSPAGE_API_KEY=your_api_key
   ```

### Slack Integration

For Slack alerts:

1. Create a Slack app and webhook
2. Configure the webhook URL:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

## Usage Examples

### Basic Event Tracking

```typescript
import { analytics, AnalyticsEvents } from '../lib/analytics';

// Track a custom event
analytics.track(AnalyticsEvents.ATTORNEY_PROFILE_VIEWED, {
  event_category: 'engagement',
  attorney_id: 'attorney123',
  legal_area: 'family_law',
  location: 'Montreal',
  value: 1
});
```

### Conversion Tracking

```typescript
import { conversions } from '../lib/conversions';

// Track consultation booking conversion
await conversions.consultationBooked({
  userId: 'user123',
  value: 150,
  currency: 'CAD',
  metadata: {
    legal_area: 'family_law',
    attorney_id: 'attorney456'
  }
});
```

### Performance Monitoring

```typescript
import { trackMemoryUsage, markPerformance } from '../lib/performance';

// Track memory usage
trackMemoryUsage();

// Mark performance points
markPerformance('api_call_start');
// ... make API call
markPerformance('api_call_end');
```

### Error Handling

```typescript
import { trackError } from '../lib/analytics';

try {
  // Risky operation
  await processPayment();
} catch (error) {
  trackError(error, 'payment_processing');
  throw error;
}
```

## Troubleshooting

### Common Issues

1. **Analytics Not Loading**:
   - Check consent is given
   - Verify environment variables
   - Check browser console for errors

2. **Events Not Tracking**:
   - Ensure analytics is initialized
   - Check network tab for failed requests
   - Verify event parameters

3. **Sentry Errors**:
   - Check DSN configuration
   - Verify organization and project settings
   - Ensure auth token has correct permissions

4. **Performance Issues**:
   - Check if observers are supported
   - Verify Web Vitals implementation
   - Monitor browser console warnings

### Debug Mode

Enable debug mode in development:

```typescript
// Set in environment
NODE_ENV=development

// Analytics will log detailed information to console
```

### Monitoring Health

Check system health endpoint:
```bash
curl https://judge.ca/api/monitoring/uptime
```

### Analytics Verification

Verify analytics setup:
```bash
curl https://judge.ca/api/analytics/dashboard
```

## Best Practices

1. **Event Naming**: Use consistent, descriptive event names
2. **Data Privacy**: Always check consent before tracking
3. **Performance**: Avoid tracking excessive events
4. **Error Handling**: Gracefully handle analytics failures
5. **Testing**: Test analytics in development environment
6. **Documentation**: Keep tracking documentation updated

## Security Considerations

1. **API Keys**: Never expose sensitive keys in client-side code
2. **User Data**: Anonymize or hash sensitive user information
3. **Consent**: Respect user privacy choices
4. **Data Retention**: Implement appropriate data retention policies
5. **Access Control**: Limit access to analytics data

## Maintenance

### Regular Tasks

1. **Review Metrics**: Weekly analytics review
2. **Update Thresholds**: Adjust alert thresholds based on trends
3. **Clean Data**: Remove old analytics data per retention policy
4. **Test Alerts**: Monthly alert system testing
5. **Update Documentation**: Keep implementation docs current

### Monitoring Checklist

- [ ] All analytics services are receiving data
- [ ] Error rates are within acceptable limits
- [ ] Performance metrics are healthy
- [ ] Alert systems are functioning
- [ ] Consent management is working
- [ ] Dashboard is displaying accurate data

## Support

For issues with the analytics implementation:

1. Check this documentation
2. Review browser console for errors
3. Check Sentry for error reports
4. Monitor Slack alerts
5. Contact the development team

---

**Last Updated**: August 16, 2025
**Version**: 1.0.0
**Maintained by**: Judge.ca Development Team