// Advanced Analytics and Tracking System for PVT Ecosystem
// Comprehensive user behavior analysis and business intelligence

class AdvancedAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.events = [];
        this.metrics = new Map();
        this.heatmapData = [];
        this.performanceMetrics = new Map();
        this.conversionFunnels = new Map();
        this.userJourney = [];
        this.realTimeData = new Map();
        this.init();
    }

    init() {
        this.setupEventTracking();
        this.setupHeatmapTracking();
        this.setupPerformanceTracking();
        this.setupConversionTracking();
        this.setupUserJourneyTracking();
        this.setupRealTimeAnalytics();
        this.setupBusinessIntelligence();
        this.startDataCollection();
    }

    // Event Tracking System
    setupEventTracking() {
        // Page view tracking
        this.trackEvent('page_view', {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            device_type: this.getDeviceType(),
            session_id: this.sessionId
        });

        // Click tracking
        document.addEventListener('click', (e) => {
            this.trackEvent('click', {
                element: e.target.tagName,
                element_id: e.target.id,
                element_class: e.target.className,
                element_text: e.target.textContent?.substring(0, 100),
                position: { x: e.clientX, y: e.clientY },
                timestamp: Date.now(),
                page: window.location.pathname
            });
        });

        // Form interactions
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.trackEvent('form_submit', {
                    form_id: e.target.id,
                    form_class: e.target.className,
                    form_fields: this.getFormFields(e.target),
                    timestamp: Date.now(),
                    page: window.location.pathname
                });
            }
        });

        // Scroll tracking
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackEvent('scroll', {
                    scroll_depth: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
                    scroll_position: window.scrollY,
                    timestamp: Date.now(),
                    page: window.location.pathname
                });
            }, 100);
        });

        // Time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            this.trackEvent('time_on_page', {
                duration: Date.now() - startTime,
                page: window.location.pathname,
                timestamp: Date.now()
            });
        });
    }

    // Heatmap Tracking
    setupHeatmapTracking() {
        let heatmapTimeout;
        
        // Click heatmap
        document.addEventListener('click', (e) => {
            this.heatmapData.push({
                type: 'click',
                x: e.clientX,
                y: e.clientY,
                element: e.target.tagName,
                timestamp: Date.now(),
                page: window.location.pathname
            });
        });

        // Mouse movement heatmap
        document.addEventListener('mousemove', (e) => {
            clearTimeout(heatmapTimeout);
            heatmapTimeout = setTimeout(() => {
                this.heatmapData.push({
                    type: 'movement',
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now(),
                    page: window.location.pathname
                });
            }, 50);
        });

        // Scroll heatmap
        window.addEventListener('scroll', () => {
            this.heatmapData.push({
                type: 'scroll',
                scroll_depth: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
                viewport_height: window.innerHeight,
                timestamp: Date.now(),
                page: window.location.pathname
            });
        });
    }

    // Performance Tracking
    setupPerformanceTracking() {
        // Page load performance
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                this.performanceMetrics.set('page_load', {
                    dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp_connect: timing.connectEnd - timing.connectStart,
                    request_time: timing.responseStart - timing.requestStart,
                    response_time: timing.responseEnd - timing.responseStart,
                    dom_processing: timing.domComplete - timing.domLoading,
                    total_load_time: timing.loadEventEnd - timing.navigationStart
                });
            }
        });

        // Resource performance
        this.trackResourcePerformance();

        // Core Web Vitals
        this.trackCoreWebVitals();
    }

    trackResourcePerformance() {
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            resources.forEach(resource => {
                this.performanceMetrics.set(`resource_${resource.name}`, {
                    type: resource.initiatorType,
                    duration: resource.duration,
                    size: resource.transferSize,
                    timestamp: Date.now()
                });
            });
        }
    }

    trackCoreWebVitals() {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.performanceMetrics.set('fcp', {
                        value: entry.startTime,
                        timestamp: Date.now()
                    });
                }
            });
        });
        fcpObserver.observe({entryTypes: ['paint']});

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.performanceMetrics.set('lcp', {
                value: lastEntry.startTime,
                timestamp: Date.now()
            });
        });
        lcpObserver.observe({entryTypes: ['largest-contentful-paint']});

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.performanceMetrics.set('cls', {
                value: clsValue,
                timestamp: Date.now()
            });
        });
        clsObserver.observe({entryTypes: ['layout-shift']});
    }

    // Conversion Tracking
    setupConversionTracking() {
        // Course enrollment funnel
        this.conversionFunnels.set('course_enrollment', {
            steps: [
                'course_view',
                'course_details_view',
                'enrollment_form_view',
                'enrollment_form_submit',
                'payment_initiate',
                'payment_complete'
            ],
            current_step: 0,
            conversions: []
        });

        // Automation project funnel
        this.conversionFunnels.set('automation_project', {
            steps: [
                'automation_view',
                'project_form_view',
                'project_form_submit',
                'developer_selection',
                'payment_initiate',
                'project_start'
            ],
            current_step: 0,
            conversions: []
        });

        // United membership funnel
        this.conversionFunnels.set('united_membership', {
            steps: [
                'united_view',
                'membership_info_view',
                'signup_form_view',
                'signup_form_submit',
                'payment_initiate',
                'membership_active'
            ],
            current_step: 0,
            conversions: []
        });
    }

    trackConversion(funnelName, step, data = {}) {
        const funnel = this.conversionFunnels.get(funnelName);
        if (funnel) {
            const stepIndex = funnel.steps.indexOf(step);
            if (stepIndex !== -1) {
                funnel.conversions.push({
                    step,
                    step_index: stepIndex,
                    timestamp: Date.now(),
                    data,
                    user_id: this.userId,
                    session_id: this.sessionId
                });
            }
        }
    }

    // User Journey Tracking
    setupUserJourneyTracking() {
        // Track page transitions
        let previousPage = window.location.pathname;
        
        const trackPageChange = () => {
            if (window.location.pathname !== previousPage) {
                this.userJourney.push({
                    from: previousPage,
                    to: window.location.pathname,
                    timestamp: Date.now(),
                    referrer: document.referrer,
                    method: 'navigation'
                });
                previousPage = window.location.pathname;
            }
        };

        // Use MutationObserver for SPA navigation
        const observer = new MutationObserver(trackPageChange);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Track external link clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.hostname !== window.location.hostname) {
                this.userJourney.push({
                    type: 'external_link',
                    url: e.target.href,
                    timestamp: Date.now(),
                    page: window.location.pathname
                });
            }
        });
    }

    // Real-Time Analytics
    setupRealTimeAnalytics() {
        // Active users tracking
        this.realTimeData.set('active_users', 1);
        
        // Real-time events
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 1000);

        // Page engagement
        this.trackPageEngagement();
    }

    updateRealTimeMetrics() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Events in last minute
        const recentEvents = this.events.filter(event => event.timestamp > oneMinuteAgo);
        this.realTimeData.set('events_per_minute', recentEvents.length);
        
        // Page views in last minute
        const recentPageViews = recentEvents.filter(event => event.type === 'page_view');
        this.realTimeData.set('page_views_per_minute', recentPageViews.length);
        
        // Update server with real-time data
        this.sendRealTimeData();
    }

    trackPageEngagement() {
        let engagementScore = 0;
        let startTime = Date.now();
        
        // Mouse activity
        document.addEventListener('mousemove', () => {
            engagementScore += 0.1;
        });
        
        // Scroll activity
        window.addEventListener('scroll', () => {
            engagementScore += 0.2;
        });
        
        // Click activity
        document.addEventListener('click', () => {
            engagementScore += 0.5;
        });
        
        // Keyboard activity
        document.addEventListener('keydown', () => {
            engagementScore += 0.3;
        });
        
        // Update engagement score every 5 seconds
        setInterval(() => {
            this.realTimeData.set('engagement_score', {
                score: engagementScore,
                time_on_page: Date.now() - startTime,
                timestamp: Date.now()
            });
        }, 5000);
    }

    // Business Intelligence
    setupBusinessIntelligence() {
        // User segmentation
        this.segmentUser();
        
        // Predictive analytics
        this.predictUserBehavior();
        
        // Revenue tracking
        this.trackRevenue();
    }

    segmentUser() {
        const pageHistory = this.getUserPageHistory();
        const engagementLevel = this.calculateEngagementLevel();
        const deviceType = this.getDeviceType();
        
        let segment = 'visitor';
        
        if (pageHistory.includes('/academy/') && engagementLevel > 0.7) {
            segment = 'academy_interested';
        } else if (pageHistory.includes('/automation/') && engagementLevel > 0.5) {
            segment = 'automation_interested';
        } else if (pageHistory.includes('/united/') && engagementLevel > 0.6) {
            segment = 'united_interested';
        } else if (engagementLevel > 0.8) {
            segment = 'highly_engaged';
        }
        
        this.trackEvent('user_segmentation', {
            segment,
            engagement_level: engagementLevel,
            device_type: deviceType,
            page_history: pageHistory,
            timestamp: Date.now()
        });
    }

    predictUserBehavior() {
        const features = {
            time_on_site: this.calculateTimeOnSite(),
            pages_visited: this.getUniquePageViews(),
            scroll_depth: this.getAverageScrollDepth(),
            click_rate: this.getClickRate(),
            form_interactions: this.getFormInteractions(),
            device_type: this.getDeviceType(),
            referrer_type: this.getReferrerType()
        };
        
        // Simple prediction model (in production, use ML service)
        let conversionProbability = 0;
        conversionProbability += features.time_on_site > 300 ? 0.2 : 0;
        conversionProbability += features.pages_visited > 3 ? 0.15 : 0;
        conversionProbability += features.scroll_depth > 0.7 ? 0.1 : 0;
        conversionProbability += features.click_rate > 0.05 ? 0.1 : 0;
        conversionProbability += features.form_interactions > 0 ? 0.25 : 0;
        conversionProbability += features.device_type === 'desktop' ? 0.1 : 0;
        conversionProbability += features.referrer_type === 'organic' ? 0.1 : 0;
        
        this.trackEvent('conversion_prediction', {
            probability: Math.min(conversionProbability, 1),
            features,
            timestamp: Date.now()
        });
    }

    trackRevenue() {
        // Track revenue events
        window.addEventListener('revenue_event', (e) => {
            this.trackEvent('revenue', {
                amount: e.detail.amount,
                currency: e.detail.currency,
                product: e.detail.product,
                transaction_id: e.detail.transaction_id,
                timestamp: Date.now()
            });
        });
    }

    // Utility Methods
    trackEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now(),
            user_id: this.userId,
            session_id: this.sessionId,
            page: window.location.pathname
        };
        
        this.events.push(event);
        
        // Send to server immediately for critical events
        if (['conversion', 'revenue', 'error'].includes(type)) {
            this.sendEventToServer(event);
        }
        
        // Store in localStorage for offline support
        this.storeEventLocally(event);
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getUserId() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'anonymous_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }

    getDeviceType() {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    getFormFields(form) {
        const fields = [];
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'password') {
                fields.push({
                    name: input.name,
                    type: input.type,
                    value: input.value.length > 0 ? 'filled' : 'empty'
                });
            }
        });
        return fields;
    }

    getUserPageHistory() {
        return this.events
            .filter(event => event.type === 'page_view')
            .map(event => event.data.page);
    }

    calculateEngagementLevel() {
        const timeOnSite = this.calculateTimeOnSite();
        const pageViews = this.getUniquePageViews();
        const scrollDepth = this.getAverageScrollDepth();
        const clickRate = this.getClickRate();
        
        // Weighted engagement score
        return (timeOnSite / 1000 * 0.3) + (pageViews * 0.2) + (scrollDepth * 0.3) + (clickRate * 100 * 0.2);
    }

    calculateTimeOnSite() {
        const pageViewEvents = this.events.filter(event => event.type === 'page_view');
        if (pageViewEvents.length === 0) return 0;
        
        const firstPageView = pageViewEvents[0].timestamp;
        return Date.now() - firstPageView;
    }

    getUniquePageViews() {
        const pageViews = this.events
            .filter(event => event.type === 'page_view')
            .map(event => event.data.page);
        return new Set(pageViews).size;
    }

    getAverageScrollDepth() {
        const scrollEvents = this.events.filter(event => event.type === 'scroll');
        if (scrollEvents.length === 0) return 0;
        
        const totalDepth = scrollEvents.reduce((sum, event) => sum + event.data.scroll_depth, 0);
        return totalDepth / scrollEvents.length / 100;
    }

    getClickRate() {
        const clickEvents = this.events.filter(event => event.type === 'click');
        const timeOnSite = this.calculateTimeOnSite();
        
        if (timeOnSite === 0) return 0;
        return clickEvents.length / (timeOnSite / 1000);
    }

    getFormInteractions() {
        return this.events.filter(event => event.type === 'form_submit').length;
    }

    getReferrerType() {
        const referrer = document.referrer;
        if (!referrer) return 'direct';
        
        const hostname = new URL(referrer).hostname;
        if (hostname.includes('google')) return 'organic';
        if (hostname.includes('facebook') || hostname.includes('twitter')) return 'social';
        return 'referral';
    }

    // Data Persistence
    storeEventLocally(event) {
        const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        storedEvents.push(event);
        
        // Keep only last 1000 events
        if (storedEvents.length > 1000) {
            storedEvents.splice(0, storedEvents.length - 1000);
        }
        
        localStorage.setItem('analytics_events', JSON.stringify(storedEvents));
    }

    sendEventToServer(event) {
        // Send to analytics endpoint
        fetch('/api/analytics/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        }).catch(error => {
            console.error('Failed to send analytics event:', error);
        });
    }

    sendRealTimeData() {
        const data = Object.fromEntries(this.realTimeData);
        
        fetch('/api/analytics/realtime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(error => {
            console.error('Failed to send real-time data:', error);
        });
    }

    startDataCollection() {
        // Send batched events every 30 seconds
        setInterval(() => {
            this.sendBatchedEvents();
        }, 30000);
        
        // Send all events before page unload
        window.addEventListener('beforeunload', () => {
            this.sendBatchedEvents();
        });
    }

    sendBatchedEvents() {
        if (this.events.length === 0) return;
        
        const events = [...this.events];
        this.events = [];
        
        fetch('/api/analytics/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(events)
        }).catch(error => {
            console.error('Failed to send batched events:', error);
            // Re-add events to queue for retry
            this.events.unshift(...events);
        });
    }

    // Public API
    track(eventType, data) {
        this.trackEvent(eventType, data);
    }

    getAnalytics() {
        return {
            events: this.events,
            metrics: Object.fromEntries(this.metrics),
            performance: Object.fromEntries(this.performanceMetrics),
            conversions: Object.fromEntries(this.conversionFunnels),
            userJourney: this.userJourney,
            realTime: Object.fromEntries(this.realTimeData)
        };
    }
}

// Initialize analytics
const analytics = new AdvancedAnalytics();

// Export for global use
window.Analytics = analytics;

// Convenience methods
window.trackEvent = (type, data) => analytics.track(type, data);
window.trackConversion = (funnel, step, data) => analytics.trackConversion(funnel, step, data);
window.getAnalytics = () => analytics.getAnalytics();

// Track course enrollments
document.addEventListener('course_enrollment', (e) => {
    analytics.trackConversion('course_enrollment', 'enrollment_form_submit', {
        course: e.detail.course,
        price: e.detail.price
    });
});

// Track automation projects
document.addEventListener('project_submission', (e) => {
    analytics.trackConversion('automation_project', 'project_form_submit', {
        budget: e.detail.budget,
        category: e.detail.category
    });
});

// Track United signups
document.addEventListener('united_signup', (e) => {
    analytics.trackConversion('united_membership', 'signup_form_submit', {
        plan: e.detail.plan,
        properties: e.detail.properties
    });
});

console.log('Advanced Analytics System initialized');
console.log('Session ID:', analytics.sessionId);
console.log('User ID:', analytics.userId);