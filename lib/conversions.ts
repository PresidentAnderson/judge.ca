import { analytics, AnalyticsEvents } from './analytics';

// Conversion event types for legal platform
export enum ConversionType {
  ATTORNEY_SIGNUP = 'attorney_signup',
  CLIENT_SIGNUP = 'client_signup',
  CONSULTATION_BOOKED = 'consultation_booked',
  CONSULTATION_COMPLETED = 'consultation_completed',
  PAYMENT_COMPLETED = 'payment_completed',
  SUBSCRIPTION_STARTED = 'subscription_started',
  LEAD_GENERATED = 'lead_generated',
  PREMIUM_UPGRADE = 'premium_upgrade',
  REFERRAL_COMPLETED = 'referral_completed'
}

// Conversion value configuration (in CAD)
const CONVERSION_VALUES = {
  [ConversionType.ATTORNEY_SIGNUP]: 250, // Value of acquiring an attorney
  [ConversionType.CLIENT_SIGNUP]: 50, // Value of acquiring a client
  [ConversionType.CONSULTATION_BOOKED]: 100, // Base value for booking
  [ConversionType.CONSULTATION_COMPLETED]: 0, // Dynamic based on actual payment
  [ConversionType.PAYMENT_COMPLETED]: 0, // Dynamic based on payment amount
  [ConversionType.SUBSCRIPTION_STARTED]: 200, // Monthly subscription value
  [ConversionType.LEAD_GENERATED]: 25, // Lead qualification value
  [ConversionType.PREMIUM_UPGRADE]: 300, // Premium feature upgrade
  [ConversionType.REFERRAL_COMPLETED]: 75 // Referral bonus value
};

interface ConversionData {
  type: ConversionType;
  value?: number;
  currency?: string;
  userId?: string;
  attorneyId?: string;
  consultationId?: string;
  metadata?: any;
  source?: string;
  medium?: string;
  campaign?: string;
}

interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate?: number;
  dropOffRate?: number;
}

class ConversionTracker {
  private conversionHistory: ConversionData[] = [];
  private conversionFunnels: Map<string, ConversionFunnel[]> = new Map();

  // Track a conversion event
  async trackConversion(data: ConversionData): Promise<void> {
    const conversionValue = data.value || CONVERSION_VALUES[data.type];
    const currency = data.currency || 'CAD';

    // Enhanced conversion data
    const enhancedData: ConversionData = {
      ...data,
      value: conversionValue,
      currency,
      timestamp: new Date().toISOString(),
      source: data.source || this.getTrafficSource(),
      medium: data.medium || this.getTrafficMedium(),
      campaign: data.campaign || this.getCampaignInfo()
    };

    // Store conversion
    this.conversionHistory.push(enhancedData);

    // Track in analytics platforms
    await this.sendToAnalyticsPlatforms(enhancedData);

    // Update funnel metrics
    this.updateFunnelMetrics(data.type);

    console.log(`Conversion tracked: ${data.type}`, enhancedData);
  }

  // Send conversion to all analytics platforms
  private async sendToAnalyticsPlatforms(data: ConversionData): Promise<void> {
    try {
      // Google Analytics 4 Enhanced Ecommerce
      this.trackGA4Conversion(data);

      // Facebook Conversions API
      this.trackFacebookConversion(data);

      // Google Ads Conversion Tracking
      this.trackGoogleAdsConversion(data);

      // Internal analytics tracking
      this.trackInternalConversion(data);

    } catch (error) {
      console.error('Failed to send conversion to analytics platforms:', error);
    }
  }

  // Google Analytics 4 Enhanced Ecommerce tracking
  private trackGA4Conversion(data: ConversionData): void {
    if (typeof window !== 'undefined' && window.gtag) {
      // Map conversion types to GA4 events
      const ga4EventMap: { [key: string]: string } = {
        [ConversionType.ATTORNEY_SIGNUP]: 'sign_up',
        [ConversionType.CLIENT_SIGNUP]: 'sign_up',
        [ConversionType.CONSULTATION_BOOKED]: 'begin_checkout',
        [ConversionType.CONSULTATION_COMPLETED]: 'purchase',
        [ConversionType.PAYMENT_COMPLETED]: 'purchase',
        [ConversionType.SUBSCRIPTION_STARTED]: 'subscribe',
        [ConversionType.LEAD_GENERATED]: 'generate_lead',
        [ConversionType.PREMIUM_UPGRADE]: 'purchase',
        [ConversionType.REFERRAL_COMPLETED]: 'share'
      };

      const ga4Event = ga4EventMap[data.type] || 'conversion';

      // Enhanced ecommerce parameters
      const ecommerceParams: any = {
        currency: data.currency,
        value: data.value,
        transaction_id: data.consultationId || `conv_${Date.now()}`,
        source: data.source,
        medium: data.medium,
        campaign: data.campaign
      };

      // Add items for purchase events
      if (ga4Event === 'purchase') {
        ecommerceParams.items = [{
          item_id: data.consultationId || data.type,
          item_name: this.getConversionDisplayName(data.type),
          item_category: 'legal_services',
          item_variant: data.metadata?.service_type || 'standard',
          price: data.value,
          quantity: 1
        }];
      }

      // Track the conversion
      window.gtag('event', ga4Event, ecommerceParams);

      // Custom conversion event
      window.gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GA4_ID,
        event_category: 'conversion',
        event_label: data.type,
        value: data.value,
        currency: data.currency,
        user_id: data.userId,
        custom_parameter_1: data.metadata?.legal_area,
        custom_parameter_2: data.metadata?.attorney_specialization
      });
    }
  }

  // Facebook Conversions API tracking
  private trackFacebookConversion(data: ConversionData): void {
    if (typeof window !== 'undefined' && window.fbq) {
      // Map conversion types to Facebook events
      const fbEventMap: { [key: string]: string } = {
        [ConversionType.ATTORNEY_SIGNUP]: 'CompleteRegistration',
        [ConversionType.CLIENT_SIGNUP]: 'CompleteRegistration',
        [ConversionType.CONSULTATION_BOOKED]: 'InitiateCheckout',
        [ConversionType.CONSULTATION_COMPLETED]: 'Purchase',
        [ConversionType.PAYMENT_COMPLETED]: 'Purchase',
        [ConversionType.SUBSCRIPTION_STARTED]: 'Subscribe',
        [ConversionType.LEAD_GENERATED]: 'Lead',
        [ConversionType.PREMIUM_UPGRADE]: 'Purchase',
        [ConversionType.REFERRAL_COMPLETED]: 'CompleteRegistration'
      };

      const fbEvent = fbEventMap[data.type] || 'CustomEvent';

      // Facebook pixel parameters
      const fbParams = {
        value: data.value,
        currency: data.currency,
        content_type: 'legal_service',
        content_category: data.metadata?.legal_area || 'general',
        content_name: this.getConversionDisplayName(data.type),
        custom_data: {
          user_type: data.attorneyId ? 'attorney' : 'client',
          service_area: data.metadata?.legal_area,
          conversion_source: data.source,
          conversion_medium: data.medium
        }
      };

      window.fbq('track', fbEvent, fbParams);

      // Track custom conversion for optimization
      window.fbq('trackCustom', `Judge_${data.type}`, {
        value: data.value,
        currency: data.currency,
        legal_area: data.metadata?.legal_area
      });
    }
  }

  // Google Ads Conversion Tracking
  private trackGoogleAdsConversion(data: ConversionData): void {
    if (typeof window !== 'undefined' && window.gtag) {
      // Google Ads conversion labels (configure in Google Ads)
      const conversionLabels: { [key: string]: string } = {
        [ConversionType.ATTORNEY_SIGNUP]: 'attorney_signup_conversion',
        [ConversionType.CLIENT_SIGNUP]: 'client_signup_conversion',
        [ConversionType.CONSULTATION_BOOKED]: 'consultation_booking_conversion',
        [ConversionType.CONSULTATION_COMPLETED]: 'consultation_completion_conversion',
        [ConversionType.PAYMENT_COMPLETED]: 'payment_conversion',
        [ConversionType.SUBSCRIPTION_STARTED]: 'subscription_conversion'
      };

      const conversionLabel = conversionLabels[data.type];
      if (conversionLabel && process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
        window.gtag('event', 'conversion', {
          send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/${conversionLabel}`,
          value: data.value,
          currency: data.currency,
          transaction_id: data.consultationId
        });
      }
    }
  }

  // Internal analytics tracking
  private trackInternalConversion(data: ConversionData): void {
    analytics.track(AnalyticsEvents.CONSULTATION_REQUEST_COMPLETED, {
      event_category: 'conversion',
      event_label: data.type,
      value: data.value,
      currency: data.currency,
      user_id: data.userId,
      attorney_id: data.attorneyId,
      consultation_id: data.consultationId,
      conversion_source: data.source,
      conversion_medium: data.medium,
      conversion_campaign: data.campaign,
      ...data.metadata
    });
  }

  // Update funnel metrics
  private updateFunnelMetrics(conversionType: ConversionType): void {
    // Define conversion funnels
    const funnels = {
      'client_journey': [
        'page_view',
        'attorney_search',
        'attorney_profile_view',
        'consultation_request',
        'consultation_booked',
        'payment_completed'
      ],
      'attorney_journey': [
        'landing_page',
        'signup_started',
        'profile_creation',
        'verification_submitted',
        'verification_completed',
        'first_consultation'
      ]
    };

    // Update relevant funnels
    Object.entries(funnels).forEach(([funnelName, stages]) => {
      if (this.isConversionInFunnel(conversionType, stages)) {
        this.incrementFunnelStage(funnelName, conversionType.toString());
      }
    });
  }

  // Check if conversion is part of a funnel
  private isConversionInFunnel(conversionType: ConversionType, stages: string[]): boolean {
    return stages.some(stage => stage.includes(conversionType.toString().split('_')[0]));
  }

  // Increment funnel stage counter
  private incrementFunnelStage(funnelName: string, stage: string): void {
    const funnel = this.conversionFunnels.get(funnelName) || [];
    const stageIndex = funnel.findIndex(f => f.stage === stage);
    
    if (stageIndex >= 0) {
      funnel[stageIndex].users += 1;
    } else {
      funnel.push({ stage, users: 1 });
    }
    
    this.conversionFunnels.set(funnelName, funnel);
    this.calculateConversionRates(funnelName);
  }

  // Calculate conversion rates for funnel
  private calculateConversionRates(funnelName: string): void {
    const funnel = this.conversionFunnels.get(funnelName);
    if (!funnel || funnel.length < 2) {return;}

    for (let i = 1; i < funnel.length; i++) {
      const currentStage = funnel[i];
      const previousStage = funnel[i - 1];
      
      currentStage.conversionRate = (currentStage.users / previousStage.users) * 100;
      previousStage.dropOffRate = 100 - currentStage.conversionRate;
    }
  }

  // Get traffic source from referrer or UTM parameters
  private getTrafficSource(): string {
    if (typeof window === 'undefined') {return 'direct';}

    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    
    if (utmSource) {return utmSource;}
    
    const referrer = document.referrer;
    if (!referrer) {return 'direct';}
    
    const referrerDomain = new URL(referrer).hostname;
    
    // Common traffic sources
    if (referrerDomain.includes('google')) {return 'google';}
    if (referrerDomain.includes('facebook')) {return 'facebook';}
    if (referrerDomain.includes('linkedin')) {return 'linkedin';}
    if (referrerDomain.includes('twitter')) {return 'twitter';}
    if (referrerDomain.includes('bing')) {return 'bing';}
    
    return 'referral';
  }

  // Get traffic medium
  private getTrafficMedium(): string {
    if (typeof window === 'undefined') {return 'none';}

    const urlParams = new URLSearchParams(window.location.search);
    const utmMedium = urlParams.get('utm_medium');
    
    if (utmMedium) {return utmMedium;}
    
    const source = this.getTrafficSource();
    
    // Infer medium from source
    if (['google', 'bing'].includes(source)) {return 'organic';}
    if (['facebook', 'linkedin', 'twitter'].includes(source)) {return 'social';}
    if (source === 'direct') {return 'none';}
    if (source === 'referral') {return 'referral';}
    
    return 'unknown';
  }

  // Get campaign information
  private getCampaignInfo(): string {
    if (typeof window === 'undefined') {return 'none';}

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_campaign') || 'none';
  }

  // Get display name for conversion type
  private getConversionDisplayName(type: ConversionType): string {
    const displayNames = {
      [ConversionType.ATTORNEY_SIGNUP]: 'Attorney Registration',
      [ConversionType.CLIENT_SIGNUP]: 'Client Registration',
      [ConversionType.CONSULTATION_BOOKED]: 'Legal Consultation Booking',
      [ConversionType.CONSULTATION_COMPLETED]: 'Legal Consultation',
      [ConversionType.PAYMENT_COMPLETED]: 'Legal Service Payment',
      [ConversionType.SUBSCRIPTION_STARTED]: 'Premium Subscription',
      [ConversionType.LEAD_GENERATED]: 'Legal Inquiry',
      [ConversionType.PREMIUM_UPGRADE]: 'Premium Upgrade',
      [ConversionType.REFERRAL_COMPLETED]: 'Referral Program'
    };

    return displayNames[type] || type;
  }

  // Get conversion history
  getConversionHistory(limit = 100): ConversionData[] {
    return this.conversionHistory.slice(-limit);
  }

  // Get funnel data
  getFunnelData(funnelName: string): ConversionFunnel[] | undefined {
    return this.conversionFunnels.get(funnelName);
  }

  // Get conversion metrics
  getConversionMetrics(timeframe = '24h'): any {
    const now = new Date();
    const timeframePeriods = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const periodMs = timeframePeriods[timeframe as keyof typeof timeframePeriods] || timeframePeriods['24h'];
    const startTime = new Date(now.getTime() - periodMs);

    const periodConversions = this.conversionHistory.filter(
      conv => new Date(conv.timestamp || 0) >= startTime
    );

    const totalValue = periodConversions.reduce((sum, conv) => sum + (conv.value || 0), 0);
    const totalConversions = periodConversions.length;

    const conversionsByType = periodConversions.reduce((acc, conv) => {
      acc[conv.type] = (acc[conv.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConversions,
      totalValue,
      averageValue: totalConversions > 0 ? totalValue / totalConversions : 0,
      conversionsByType,
      timeframe,
      period: { start: startTime, end: now }
    };
  }
}

// Create singleton instance
export const conversionTracker = new ConversionTracker();

// Convenience functions for common conversions
export const conversions = {
  attorneySignup: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.ATTORNEY_SIGNUP }),
  
  clientSignup: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.CLIENT_SIGNUP }),
  
  consultationBooked: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.CONSULTATION_BOOKED }),
  
  consultationCompleted: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.CONSULTATION_COMPLETED }),
  
  paymentCompleted: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.PAYMENT_COMPLETED }),
  
  subscriptionStarted: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.SUBSCRIPTION_STARTED }),
  
  leadGenerated: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.LEAD_GENERATED }),
  
  premiumUpgrade: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.PREMIUM_UPGRADE }),
  
  referralCompleted: (data: Omit<ConversionData, 'type'>) =>
    conversionTracker.trackConversion({ ...data, type: ConversionType.REFERRAL_COMPLETED })
};

export default conversionTracker;