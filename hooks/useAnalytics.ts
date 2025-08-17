import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { analytics, AnalyticsEvents } from '../lib/analytics';
import { alertManager, AlertType } from '../lib/alerts';

// Custom hook for analytics tracking
export function useAnalytics() {
  const router = useRouter();

  // Track page views automatically
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url, document.title);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  // Attorney-specific tracking functions
  const trackAttorneySignup = useCallback((attorneyData: {
    id: string;
    email: string;
    specialization: string;
    location: string;
  }) => {
    analytics.track(AnalyticsEvents.ATTORNEY_SIGNUP, {
      event_category: 'attorney_acquisition',
      event_label: 'signup_completed',
      attorney_id: attorneyData.id,
      legal_area: attorneyData.specialization,
      location: attorneyData.location,
      value: 1
    });
  }, []);

  const trackAttorneyProfileView = useCallback((attorneyData: {
    id: string;
    specialization: string;
    location: string;
    rating?: number;
  }) => {
    analytics.track(AnalyticsEvents.ATTORNEY_PROFILE_VIEWED, {
      event_category: 'engagement',
      event_label: 'profile_viewed',
      attorney_id: attorneyData.id,
      legal_area: attorneyData.specialization,
      location: attorneyData.location,
      rating: attorneyData.rating,
      value: 1
    });
  }, []);

  const trackAttorneyVerification = useCallback((attorneyId: string, status: 'started' | 'completed' | 'failed') => {
    const eventMap = {
      started: AnalyticsEvents.ATTORNEY_VERIFICATION_STARTED,
      completed: AnalyticsEvents.ATTORNEY_VERIFICATION_COMPLETED,
      failed: AnalyticsEvents.ERROR_OCCURRED
    };

    analytics.track(eventMap[status], {
      event_category: 'attorney_onboarding',
      event_label: `verification_${status}`,
      attorney_id: attorneyId,
      value: status === 'completed' ? 1 : 0
    });

    // Alert for verification failures
    if (status === 'failed') {
      alertManager.triggerAlert(
        AlertType.ATTORNEY_VERIFICATION_ISSUE,
        `Attorney verification failed for ID: ${attorneyId}`,
        { attorneyId, status }
      );
    }
  }, []);

  // Consultation-specific tracking functions
  const trackConsultationRequest = useCallback((requestData: {
    id: string;
    userId: string;
    legalArea: string;
    urgency: 'low' | 'medium' | 'high';
    estimatedValue?: number;
  }) => {
    analytics.track(AnalyticsEvents.CONSULTATION_REQUEST_STARTED, {
      event_category: 'lead_generation',
      event_label: 'consultation_requested',
      user_id: requestData.userId,
      consultation_id: requestData.id,
      legal_area: requestData.legalArea,
      urgency: requestData.urgency,
      value: requestData.estimatedValue || 0
    });
  }, []);

  const trackConsultationCompleted = useCallback((consultationData: {
    id: string;
    userId: string;
    attorneyId: string;
    legalArea: string;
    value: number;
    duration: number; // minutes
    rating?: number;
  }) => {
    analytics.track(AnalyticsEvents.CONSULTATION_REQUEST_COMPLETED, {
      event_category: 'conversion',
      event_label: 'consultation_completed',
      user_id: consultationData.userId,
      attorney_id: consultationData.attorneyId,
      consultation_id: consultationData.id,
      legal_area: consultationData.legalArea,
      value: consultationData.value,
      currency: 'CAD',
      duration_minutes: consultationData.duration,
      rating: consultationData.rating
    });

    // Track high-value consultations separately
    if (consultationData.value > 500) {
      analytics.track(AnalyticsEvents.CONSULTATION_COMPLETED, {
        event_category: 'high_value_conversion',
        event_label: 'premium_consultation',
        value: consultationData.value,
        legal_area: consultationData.legalArea
      });
    }
  }, []);

  const trackConsultationScheduled = useCallback((schedulingData: {
    consultationId: string;
    userId: string;
    attorneyId: string;
    scheduledDate: Date;
    legalArea: string;
    consultationType: 'video' | 'phone' | 'in_person';
  }) => {
    analytics.track(AnalyticsEvents.CONSULTATION_SCHEDULED, {
      event_category: 'scheduling',
      event_label: 'consultation_scheduled',
      user_id: schedulingData.userId,
      attorney_id: schedulingData.attorneyId,
      consultation_id: schedulingData.consultationId,
      legal_area: schedulingData.legalArea,
      consultation_type: schedulingData.consultationType,
      scheduled_date: schedulingData.scheduledDate.toISOString(),
      value: 1
    });
  }, []);

  const trackConsultationCancelled = useCallback((cancellationData: {
    consultationId: string;
    userId: string;
    attorneyId: string;
    reason: string;
    cancelledBy: 'client' | 'attorney' | 'system';
  }) => {
    analytics.track(AnalyticsEvents.CONSULTATION_CANCELLED, {
      event_category: 'cancellation',
      event_label: 'consultation_cancelled',
      user_id: cancellationData.userId,
      attorney_id: cancellationData.attorneyId,
      consultation_id: cancellationData.consultationId,
      cancellation_reason: cancellationData.reason,
      cancelled_by: cancellationData.cancelledBy,
      value: 0
    });
  }, []);

  // Search and matching tracking
  const trackAttorneySearch = useCallback((searchData: {
    userId?: string;
    query: string;
    filters: {
      legalArea?: string;
      location?: string;
      rating?: number;
      priceRange?: string;
    };
    resultsCount: number;
  }) => {
    analytics.track(AnalyticsEvents.ATTORNEY_SEARCH_PERFORMED, {
      event_category: 'search',
      event_label: 'attorney_search',
      user_id: searchData.userId,
      search_query: searchData.query,
      legal_area: searchData.filters.legalArea,
      location: searchData.filters.location,
      min_rating: searchData.filters.rating,
      price_range: searchData.filters.priceRange,
      results_count: searchData.resultsCount,
      value: searchData.resultsCount
    });
  }, []);

  const trackMatchRequest = useCallback((matchData: {
    userId: string;
    attorneyId: string;
    legalArea: string;
    requestMessage?: string;
  }) => {
    analytics.track(AnalyticsEvents.MATCH_REQUEST_SENT, {
      event_category: 'matching',
      event_label: 'match_request_sent',
      user_id: matchData.userId,
      attorney_id: matchData.attorneyId,
      legal_area: matchData.legalArea,
      has_message: !!matchData.requestMessage,
      value: 1
    });
  }, []);

  const trackMatchResponse = useCallback((responseData: {
    userId: string;
    attorneyId: string;
    accepted: boolean;
    responseTime: number; // hours
  }) => {
    const event = responseData.accepted ? AnalyticsEvents.MATCH_ACCEPTED : AnalyticsEvents.MATCH_DECLINED;
    
    analytics.track(event, {
      event_category: 'matching',
      event_label: responseData.accepted ? 'match_accepted' : 'match_declined',
      user_id: responseData.userId,
      attorney_id: responseData.attorneyId,
      response_time_hours: responseData.responseTime,
      value: responseData.accepted ? 1 : 0
    });
  }, []);

  // Payment tracking
  const trackPaymentInitiated = useCallback((paymentData: {
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    consultationId?: string;
  }) => {
    analytics.track(AnalyticsEvents.PAYMENT_INITIATED, {
      event_category: 'payment',
      event_label: 'payment_initiated',
      user_id: paymentData.userId,
      consultation_id: paymentData.consultationId,
      value: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethod
    });
  }, []);

  const trackPaymentCompleted = useCallback((paymentData: {
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    consultationId?: string;
    attorneyId?: string;
  }) => {
    analytics.track(AnalyticsEvents.PAYMENT_COMPLETED, {
      event_category: 'payment',
      event_label: 'payment_completed',
      user_id: paymentData.userId,
      attorney_id: paymentData.attorneyId,
      consultation_id: paymentData.consultationId,
      transaction_id: paymentData.transactionId,
      value: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethod
    });

    // Track conversion
    analytics.trackConversion('payment_completed', paymentData.amount, paymentData.currency);
  }, []);

  const trackPaymentFailed = useCallback((paymentData: {
    userId: string;
    amount: number;
    error: string;
    paymentMethod: string;
    consultationId?: string;
  }) => {
    analytics.track(AnalyticsEvents.PAYMENT_FAILED, {
      event_category: 'payment',
      event_label: 'payment_failed',
      user_id: paymentData.userId,
      consultation_id: paymentData.consultationId,
      value: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      error_message: paymentData.error
    });

    // Alert for payment failures
    alertManager.triggerAlert(
      AlertType.PAYMENT_FAILURE,
      `Payment failed: ${paymentData.error}`,
      paymentData
    );
  }, []);

  // Content engagement tracking
  const trackLegalGuideView = useCallback((guideData: {
    guideId: string;
    title: string;
    category: string;
    userId?: string;
    timeSpent?: number;
  }) => {
    analytics.track(AnalyticsEvents.LEGAL_GUIDE_VIEWED, {
      event_category: 'content',
      event_label: 'legal_guide_viewed',
      user_id: guideData.userId,
      content_id: guideData.guideId,
      content_title: guideData.title,
      content_category: guideData.category,
      time_spent_seconds: guideData.timeSpent,
      value: 1
    });
  }, []);

  const trackDocumentDownload = useCallback((downloadData: {
    documentId: string;
    documentType: string;
    userId?: string;
    source: string;
  }) => {
    analytics.track(AnalyticsEvents.DOCUMENT_DOWNLOADED, {
      event_category: 'content',
      event_label: 'document_downloaded',
      user_id: downloadData.userId,
      document_id: downloadData.documentId,
      document_type: downloadData.documentType,
      download_source: downloadData.source,
      value: 1
    });
  }, []);

  // Review and feedback tracking
  const trackReviewSubmitted = useCallback((reviewData: {
    userId: string;
    attorneyId: string;
    consultationId: string;
    rating: number;
    hasComment: boolean;
  }) => {
    analytics.track(AnalyticsEvents.REVIEW_SUBMITTED, {
      event_category: 'feedback',
      event_label: 'review_submitted',
      user_id: reviewData.userId,
      attorney_id: reviewData.attorneyId,
      consultation_id: reviewData.consultationId,
      rating: reviewData.rating,
      has_comment: reviewData.hasComment,
      value: reviewData.rating
    });
  }, []);

  // Communication tracking
  const trackMessageSent = useCallback((messageData: {
    senderId: string;
    receiverId: string;
    consultationId?: string;
    messageType: 'text' | 'file' | 'voice';
  }) => {
    analytics.track(AnalyticsEvents.MESSAGE_SENT, {
      event_category: 'communication',
      event_label: 'message_sent',
      user_id: messageData.senderId,
      recipient_id: messageData.receiverId,
      consultation_id: messageData.consultationId,
      message_type: messageData.messageType,
      value: 1
    });
  }, []);

  const trackVideoCallStarted = useCallback((callData: {
    initiatorId: string;
    participantId: string;
    consultationId: string;
    callType: 'consultation' | 'followup';
  }) => {
    analytics.track(AnalyticsEvents.VIDEO_CALL_STARTED, {
      event_category: 'communication',
      event_label: 'video_call_started',
      user_id: callData.initiatorId,
      participant_id: callData.participantId,
      consultation_id: callData.consultationId,
      call_type: callData.callType,
      value: 1
    });
  }, []);

  const trackVideoCallEnded = useCallback((callData: {
    initiatorId: string;
    participantId: string;
    consultationId: string;
    duration: number; // seconds
    endReason: 'completed' | 'disconnected' | 'technical_issue';
  }) => {
    analytics.track(AnalyticsEvents.VIDEO_CALL_ENDED, {
      event_category: 'communication',
      event_label: 'video_call_ended',
      user_id: callData.initiatorId,
      participant_id: callData.participantId,
      consultation_id: callData.consultationId,
      call_duration_seconds: callData.duration,
      end_reason: callData.endReason,
      value: callData.duration
    });
  }, []);

  // Error tracking
  const trackError = useCallback((error: Error, context?: string, metadata?: any) => {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
      event_category: 'error',
      event_label: context || 'unknown_error',
      error_message: error.message,
      error_stack: error.stack,
      page_path: router.asPath,
      ...metadata
    });
  }, [router.asPath]);

  return {
    // Attorney tracking
    trackAttorneySignup,
    trackAttorneyProfileView,
    trackAttorneyVerification,
    
    // Consultation tracking
    trackConsultationRequest,
    trackConsultationCompleted,
    trackConsultationScheduled,
    trackConsultationCancelled,
    
    // Search and matching
    trackAttorneySearch,
    trackMatchRequest,
    trackMatchResponse,
    
    // Payment tracking
    trackPaymentInitiated,
    trackPaymentCompleted,
    trackPaymentFailed,
    
    // Content engagement
    trackLegalGuideView,
    trackDocumentDownload,
    
    // Reviews and feedback
    trackReviewSubmitted,
    
    // Communication
    trackMessageSent,
    trackVideoCallStarted,
    trackVideoCallEnded,
    
    // Error tracking
    trackError,
    
    // General analytics functions
    trackEvent: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackUserInteraction: analytics.trackUserInteraction.bind(analytics)
  };
}

export default useAnalytics;