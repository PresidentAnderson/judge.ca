import * as React from 'react';
import * as Sentry from '@sentry/nextjs';

// Google Tag Manager types
interface GTMConfig {
  gtmId: string;
  dataLayer?: { [key: string]: any };
}

// Google Tag Manager implementation
const TagManager = {
  initialize: (config: GTMConfig) => {
    if (typeof window === 'undefined') {return;}
    
    const { gtmId, dataLayer = {} } = config;
    
    // Add dataLayer to window
    window.dataLayer = window.dataLayer || [];
    
    // Push initial data
    window.dataLayer.push(dataLayer);
    
    // Create GTM script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);
  }
};

// Analytics configuration
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

// Analytics Events for Legal Platform
export enum AnalyticsEvents {
  // User Registration & Authentication
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // Attorney Events
  ATTORNEY_SIGNUP = 'attorney_signup',
  ATTORNEY_PROFILE_COMPLETED = 'attorney_profile_completed',
  ATTORNEY_VERIFICATION_STARTED = 'attorney_verification_started',
  ATTORNEY_VERIFICATION_COMPLETED = 'attorney_verification_completed',
  
  // Legal Consultation Events
  CONSULTATION_REQUEST_STARTED = 'consultation_request_started',
  CONSULTATION_REQUEST_COMPLETED = 'consultation_request_completed',
  CONSULTATION_SCHEDULED = 'consultation_scheduled',
  CONSULTATION_CANCELLED = 'consultation_cancelled',
  CONSULTATION_COMPLETED = 'consultation_completed',
  
  // Search & Matching
  ATTORNEY_SEARCH_PERFORMED = 'attorney_search_performed',
  ATTORNEY_PROFILE_VIEWED = 'attorney_profile_viewed',
  MATCH_REQUEST_SENT = 'match_request_sent',
  MATCH_ACCEPTED = 'match_accepted',
  MATCH_DECLINED = 'match_declined',
  
  // Payment Events
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  
  // Content Engagement
  LEGAL_GUIDE_VIEWED = 'legal_guide_viewed',
  BLOG_POST_VIEWED = 'blog_post_viewed',
  FAQ_VIEWED = 'faq_viewed',
  DOCUMENT_DOWNLOADED = 'document_downloaded',
  
  // Communication
  MESSAGE_SENT = 'message_sent',
  VIDEO_CALL_STARTED = 'video_call_started',
  VIDEO_CALL_ENDED = 'video_call_ended',
  
  // Reviews & Feedback
  REVIEW_SUBMITTED = 'review_submitted',
  RATING_GIVEN = 'rating_given',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  
  // Error & Performance
  ERROR_OCCURRED = 'error_occurred',
  PAGE_LOAD_TIME = 'page_load_time',
  API_RESPONSE_TIME = 'api_response_time',
}

// Event parameters interface
interface AnalyticsEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  user_id?: string;
  attorney_id?: string;
  consultation_id?: string;
  legal_area?: string;
  location?: string;
  error_message?: string;
  page_path?: string;
  response_time?: number;
  [key: string]: any;
}

class AnalyticsService {
  private isInitialized = false;
  private consentGiven = false;

  // Initialize all analytics services
  async initialize() {
    if (this.isInitialized) {return;}

    // Check for user consent
    this.consentGiven = this.checkConsent();

    if (!this.consentGiven) {
      console.log('Analytics consent not given, skipping initialization');
      return;
    }

    try {
      // Initialize Google Analytics 4
      if (GA4_ID) {
        await this.initializeGA4();
      }

      // Initialize Google Tag Manager
      if (GTM_ID) {
        this.initializeGTM();
      }

      // Initialize Facebook Pixel
      if (FB_PIXEL_ID) {
        this.initializeFacebookPixel();
      }

      // Initialize Microsoft Clarity
      if (CLARITY_ID) {
        this.initializeClarity();
      }

      this.isInitialized = true;
      console.log('Analytics services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      Sentry.captureException(error);
    }
  }

  // Check user consent for tracking
  private checkConsent(): boolean {
    if (typeof window === 'undefined') {return false;}
    return localStorage.getItem('analytics-consent') === 'true';
  }

  // Set user consent
  setConsent(consent: boolean) {
    if (typeof window === 'undefined') {return;}
    
    this.consentGiven = consent;
    localStorage.setItem('analytics-consent', consent.toString());
    
    if (consent && !this.isInitialized) {
      this.initialize();
    }
  }

  // Initialize Google Analytics 4
  private async initializeGA4() {
    if (!GA4_ID) {return;}

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    // Configure gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA4_ID, {
      send_page_view: false, // We'll send page views manually
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    // Enhanced ecommerce tracking
    gtag('config', GA4_ID, {
      custom_map: {
        custom_parameter_1: 'legal_area',
        custom_parameter_2: 'attorney_specialization',
        custom_parameter_3: 'consultation_type',
      }
    });
  }

  // Initialize Google Tag Manager
  private initializeGTM() {
    if (!GTM_ID) {return;}

    TagManager.initialize({
      gtmId: GTM_ID,
      dataLayer: {
        platform: 'judge.ca',
        version: '1.0.0',
      },
    });
  }

  // Initialize Facebook Pixel
  private initializeFacebookPixel() {
    if (!FB_PIXEL_ID) {return;}

    // Load Facebook Pixel script
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) {return;}
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) {f._fbq = n;}
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'));

    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Initialize Microsoft Clarity
  private initializeClarity() {
    if (!CLARITY_ID) {return;}

    (function(c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = `https://www.clarity.ms/tag/${ i}`;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    }(window, document, 'clarity', 'script', CLARITY_ID));
  }

  // Track custom events
  track(event: AnalyticsEvents, params: AnalyticsEventParams = {}) {
    if (!this.consentGiven) {return;}

    try {
      // Google Analytics 4
      if (GA4_ID && window.gtag) {
        window.gtag('event', event, {
          event_category: params.event_category || 'engagement',
          event_label: params.event_label,
          value: params.value,
          currency: params.currency || 'CAD',
          custom_parameter_1: params.legal_area,
          custom_parameter_2: params.attorney_id,
          custom_parameter_3: params.consultation_id,
          ...params,
        });
      }

      // Google Tag Manager
      if (GTM_ID && window.dataLayer) {
        window.dataLayer.push({
          event,
          eventCategory: params.event_category || 'engagement',
          eventAction: event,
          eventLabel: params.event_label,
          eventValue: params.value,
          userId: params.user_id,
          attorneyId: params.attorney_id,
          consultationId: params.consultation_id,
          legalArea: params.legal_area,
          location: params.location,
          ...params,
        });
      }

      // Facebook Pixel
      if (FB_PIXEL_ID && window.fbq) {
        const fbEventMap: { [key: string]: string } = {
          [AnalyticsEvents.USER_SIGNUP]: 'CompleteRegistration',
          [AnalyticsEvents.CONSULTATION_REQUEST_COMPLETED]: 'Lead',
          [AnalyticsEvents.PAYMENT_COMPLETED]: 'Purchase',
          [AnalyticsEvents.CONSULTATION_SCHEDULED]: 'Schedule',
        };

        const fbEvent = fbEventMap[event] || 'CustomEvent';
        window.fbq('track', fbEvent, {
          content_name: event,
          value: params.value,
          currency: params.currency || 'CAD',
          custom_data: {
            legal_area: params.legal_area,
            location: params.location,
          }
        });
      }

      // Sentry for error tracking
      if (event === AnalyticsEvents.ERROR_OCCURRED) {
        Sentry.captureException(new Error(params.error_message || 'Unknown error'), {
          tags: {
            section: params.event_category,
            page: params.page_path,
          },
          extra: params,
        });
      }

      console.log(`Analytics event tracked: ${event}`, params);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      Sentry.captureException(error);
    }
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.consentGiven) {return;}

    try {
      // Google Analytics 4
      if (GA4_ID && window.gtag) {
        window.gtag('config', GA4_ID, {
          page_path: path,
          page_title: title,
        });
      }

      // Google Tag Manager
      if (GTM_ID && window.dataLayer) {
        window.dataLayer.push({
          event: 'page_view',
          page_path: path,
          page_title: title,
        });
      }

      // Facebook Pixel
      if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'PageView');
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
      Sentry.captureException(error);
    }
  }

  // Track conversions
  trackConversion(conversionAction: string, value?: number, currency = 'CAD') {
    this.track(AnalyticsEvents.CONSULTATION_REQUEST_COMPLETED, {
      event_category: 'conversion',
      event_label: conversionAction,
      value,
      currency,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, page?: string) {
    this.track(AnalyticsEvents.PAGE_LOAD_TIME, {
      event_category: 'performance',
      event_label: metric,
      value: Math.round(value),
      page_path: page,
    });
  }

  // Track user interactions
  trackUserInteraction(element: string, action: string, location?: string) {
    this.track(AnalyticsEvents.ATTORNEY_PROFILE_VIEWED, {
      event_category: 'interaction',
      event_label: `${element}_${action}`,
      location,
    });
  }

  // Track business metrics
  trackBusinessMetric(metric: string, value: number, metadata?: any) {
    this.track(AnalyticsEvents.CONSULTATION_COMPLETED, {
      event_category: 'business',
      event_label: metric,
      value,
      ...metadata,
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Utility function for tracking errors
export const trackError = (error: Error, context?: string) => {
  analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
    event_category: 'error',
    event_label: context || 'unknown',
    error_message: error.message,
    page_path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  });
};

// HOC for tracking page views
export const withAnalytics = (WrappedComponent: React.ComponentType<any>) => {
  return function AnalyticsWrapper(props: any): JSX.Element {
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        analytics.trackPageView(window.location.pathname, document.title);
      }
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

// Declare global types for analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
  }
}

export default analytics;