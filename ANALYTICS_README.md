# Judge.ca Analytics & Monitoring System

## 🚀 Quick Start

This legal consultation platform includes comprehensive analytics and monitoring to track user behavior, system performance, and business metrics while maintaining GDPR compliance.

### Key Features

- **Multi-Platform Analytics**: Google Analytics 4, Facebook Pixel, Microsoft Clarity
- **Real-Time Performance Monitoring**: Web Vitals, resource timing, error tracking
- **Legal-Specific Event Tracking**: Consultation bookings, attorney verifications, payments
- **GDPR-Compliant Consent Management**: Granular user consent controls
- **Comprehensive Error Tracking**: Sentry integration with custom alerts
- **Business Intelligence Dashboard**: Real-time metrics and conversion tracking
- **Uptime Monitoring**: StatusPage integration with automated alerts

## 📊 Analytics Overview

### Tracked Events

#### Core Legal Platform Events
- Attorney registration and verification
- Client signup and onboarding
- Legal consultation requests and completions
- Payment processing and subscriptions
- Attorney search and matching
- Document downloads and legal guide views
- Review submissions and ratings

#### System Performance Events
- Page load times and Web Vitals
- API response times
- Error rates and types
- Memory usage and resource loading
- User interaction patterns

### Data Privacy & Compliance

- **GDPR Compliant**: Comprehensive consent management interface
- **User Privacy**: Granular tracking preferences
- **Data Anonymization**: IP anonymization and user data protection
- **Consent Categories**: Necessary, Analytics, Marketing, Personalization
- **Data Export**: GDPR data export capabilities

## 🔧 Implementation

### Environment Setup

```bash
# Required Analytics Variables
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=123456789
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxx

# Error Tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=judge-ca
SENTRY_PROJECT=judge-ca-web

# Monitoring & Alerts
STATUSPAGE_PAGE_ID=xxxxx
ALERT_EMAIL=admin@judge.ca
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Basic Usage

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function ConsultationBooking() {
  const {
    trackConsultationRequest,
    trackPaymentCompleted,
    trackError
  } = useAnalytics();

  const handleBooking = async (data) => {
    try {
      trackConsultationRequest({
        id: data.id,
        userId: data.userId,
        legalArea: data.legalArea,
        urgency: data.urgency
      });

      const result = await processBooking(data);
      
      trackPaymentCompleted({
        userId: data.userId,
        amount: data.amount,
        transactionId: result.transactionId
      });
    } catch (error) {
      trackError(error, 'consultation_booking');
    }
  };
}
```

## 📈 Dashboard Features

### Real-Time Metrics
- Active users and sessions
- Consultation bookings and revenue
- System performance and health
- Error rates and alerts

### Business Intelligence
- Conversion funnel analysis
- Attorney performance metrics
- Legal area demand trends
- Revenue and payment analytics

### Performance Monitoring
- Core Web Vitals tracking
- API response time monitoring
- Resource loading performance
- Memory usage tracking

## 🚨 Alert System

### Alert Types
- **Critical**: System outages, security incidents
- **High**: Payment failures, high error rates
- **Medium**: Performance degradation, attorney issues
- **Low**: General notifications

### Notification Channels
- Email alerts for critical issues
- Slack notifications for team alerts
- SMS for security incidents
- Webhook integration for external systems

## 🛠 Custom Implementation

### Event Tracking Hook

```typescript
const {
  // Attorney Events
  trackAttorneySignup,
  trackAttorneyProfileView,
  trackAttorneyVerification,
  
  // Consultation Events
  trackConsultationRequest,
  trackConsultationScheduled,
  trackConsultationCompleted,
  
  // Payment Events
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
  
  // Content Events
  trackLegalGuideView,
  trackDocumentDownload
} = useAnalytics();
```

### Conversion Tracking

```typescript
import { conversions } from '../lib/conversions';

// Track business conversions
await conversions.consultationBooked({
  userId: 'user123',
  value: 150,
  currency: 'CAD',
  metadata: { legal_area: 'family_law' }
});
```

### Performance Monitoring

```typescript
import { markPerformance, measurePerformance } from '../lib/performance';

// Custom performance tracking
markPerformance('search_start');
// ... perform search
markPerformance('search_end');
measurePerformance('search_duration', 'search_start', 'search_end');
```

## 📋 Key Components

### Core Files
- `lib/analytics.ts` - Main analytics service
- `lib/performance.ts` - Performance monitoring
- `lib/alerts.ts` - Alert management system
- `lib/conversions.ts` - Conversion tracking
- `hooks/useAnalytics.ts` - React hook for analytics

### UI Components
- `components/analytics/ConsentManager.tsx` - GDPR consent interface
- `components/analytics/MonitoringDashboard.tsx` - Real-time dashboard

### API Endpoints
- `/api/analytics/dashboard` - Dashboard data
- `/api/analytics/track` - Event tracking
- `/api/monitoring/uptime` - System health

## 🔍 Monitoring Dashboard

Access the real-time monitoring dashboard at `/admin/dashboard` (requires authentication).

### Dashboard Sections
1. **System Overview**: Health status, uptime, response times
2. **User Analytics**: Active users, page views, conversions
3. **Business Metrics**: Revenue, bookings, attorney signups
4. **Performance**: Web Vitals, error rates, alerts
5. **Real-Time Feed**: Live activity and system events

## 📚 Documentation

For detailed implementation guide, see: `/documentation/analytics-monitoring-guide.md`

### Key Topics Covered
- Architecture overview
- Event tracking implementation
- Performance monitoring setup
- Error handling and alerts
- GDPR compliance features
- Dashboard configuration
- Troubleshooting guide

## 🧪 Testing & Validation

### Analytics Testing
```bash
# Check analytics initialization
console.log(analytics.isInitialized);

# Test event tracking
analytics.track('test_event', { test: true });

# Validate dashboard API
curl https://judge.ca/api/analytics/dashboard
```

### Performance Testing
- Lighthouse audits for Core Web Vitals
- Bundle analyzer for optimization
- Real User Monitoring (RUM) validation

## 🚀 Deployment

The analytics system is automatically deployed with the main application:

1. **Environment Variables**: Configure in Vercel/deployment platform
2. **DNS Setup**: Ensure proper domain configuration for tracking
3. **SSL Certificate**: Required for secure analytics tracking
4. **Consent Banner**: Automatically displays for new users

## 📞 Support & Maintenance

### Regular Maintenance
- Weekly analytics review
- Monthly alert threshold adjustments
- Quarterly performance optimization
- Annual compliance audit

### Troubleshooting
- Check browser console for client-side errors
- Monitor Sentry for server-side issues
- Review Slack alerts for system notifications
- Validate environment variable configuration

## 🔐 Security & Privacy

### Data Protection
- All analytics data is anonymized
- No PII stored in tracking systems
- Secure API endpoints with rate limiting
- Regular security audits and updates

### Compliance Features
- GDPR Article 7 compliant consent
- Cookie categorization and controls
- Data retention policy enforcement
- User data export capabilities

---

**🚨 IMPORTANT**: Analytics are only initialized after user consent. The system respects user privacy choices and complies with GDPR requirements.

**📊 ANALYTICS READY**: The Judge.ca platform is now equipped with comprehensive analytics and monitoring for optimal performance and business insights.

---

**Last Updated**: August 16, 2025  
**Version**: 1.0.0  
**Contact**: development@judge.ca