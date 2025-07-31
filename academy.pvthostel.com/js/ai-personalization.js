// AI-Powered Personalization Engine for PVT Ecosystem
// Addresses market gap: 89% of users expect personalized experiences

class AIPersonalizationEngine {
    constructor() {
        this.userProfile = this.loadUserProfile();
        this.learningPath = [];
        this.recommendations = [];
        this.adaptiveContent = {};
        this.behaviorTracker = new BehaviorTracker();
        this.init();
    }

    init() {
        this.initializeUserProfiling();
        this.startBehaviorTracking();
        this.loadPersonalizedContent();
        this.setupAdaptiveLearning();
    }

    // User Profiling System
    initializeUserProfiling() {
        // Collect user characteristics
        this.userProfile = {
            userId: this.getUserId(),
            role: this.detectUserRole(),
            experience: this.assessExperience(),
            interests: this.analyzeInterests(),
            learningStyle: this.determineLearningStyle(),
            goals: this.identifyGoals(),
            preferences: this.getPreferences(),
            location: this.getLocation(),
            timezone: this.getTimezone(),
            deviceType: this.getDeviceType(),
            visitHistory: this.getVisitHistory(),
            engagementLevel: this.calculateEngagementLevel()
        };
    }

    // Adaptive Learning Path Generation
    generateLearningPath() {
        const profile = this.userProfile;
        let recommendedPath = [];

        // AI-driven path optimization based on user profile
        if (profile.role === 'hostel_owner') {
            recommendedPath = this.generateOwnerPath(profile);
        } else if (profile.role === 'staff_member') {
            recommendedPath = this.generateStaffPath(profile);
        } else if (profile.role === 'developer') {
            recommendedPath = this.generateDeveloperPath(profile);
        } else {
            recommendedPath = this.generateGeneralPath(profile);
        }

        // Personalize based on learning style
        recommendedPath = this.adaptToLearningStyle(recommendedPath, profile.learningStyle);

        // Adjust for experience level
        recommendedPath = this.adjustForExperience(recommendedPath, profile.experience);

        return recommendedPath;
    }

    generateOwnerPath(profile) {
        const basePath = [
            { 
                module: 'hospitality-foundations', 
                priority: profile.experience < 2 ? 'high' : 'medium',
                estimatedTime: '6 weeks',
                aiRecommendation: 'Essential for building strong foundation'
            },
            { 
                module: 'direct-booking-mastery', 
                priority: 'high',
                estimatedTime: '4 weeks',
                aiRecommendation: 'Critical for reducing OTA dependency'
            },
            { 
                module: 'advanced-operations', 
                priority: 'high',
                estimatedTime: '8 weeks',
                aiRecommendation: 'Maximize property profitability'
            }
        ];

        // Add mental health training if indicated
        if (profile.interests.includes('guest_safety') || profile.location === 'urban') {
            basePath.splice(1, 0, {
                module: 'mental-health-response',
                priority: 'high',
                estimatedTime: '5 weeks',
                aiRecommendation: 'Essential for urban properties and guest safety'
            });
        }

        return basePath;
    }

    generateStaffPath(profile) {
        return [
            { 
                module: 'hospitality-foundations', 
                priority: 'high',
                estimatedTime: '4 weeks',
                aiRecommendation: 'Build exceptional service skills'
            },
            { 
                module: 'mental-health-response', 
                priority: 'high',
                estimatedTime: '5 weeks',
                aiRecommendation: 'Essential for frontline staff'
            },
            { 
                module: 'technology-integration', 
                priority: 'medium',
                estimatedTime: '3 weeks',
                aiRecommendation: 'Enhance efficiency with technology'
            }
        ];
    }

    // Dynamic Content Personalization
    personalizeContent() {
        const content = document.querySelectorAll('[data-personalizable]');
        
        content.forEach(element => {
            const personalizedContent = this.generatePersonalizedContent(element);
            element.innerHTML = personalizedContent;
        });
    }

    generatePersonalizedContent(element) {
        const contentType = element.dataset.personalizable;
        const profile = this.userProfile;

        switch(contentType) {
            case 'hero-message':
                return this.generatePersonalizedHeroMessage(profile);
            case 'course-recommendations':
                return this.generateCourseRecommendations(profile);
            case 'success-stories':
                return this.generateRelevantSuccessStories(profile);
            case 'automation-projects':
                return this.generateRelevantAutomationProjects(profile);
            default:
                return element.innerHTML;
        }
    }

    generatePersonalizedHeroMessage(profile) {
        const messages = {
            hostel_owner: `Transform your ${profile.propertySize || 'property'} into a thriving, commission-free business`,
            staff_member: `Become a certified hospitality professional with mental health expertise`,
            developer: `Build solutions for the $4.5B hospitality automation market`,
            student: `Launch your hospitality career with industry-recognized training`,
            default: `Join the hospitality revolution that's transforming the industry`
        };

        const baseMessage = messages[profile.role] || messages.default;
        
        // Add location-specific context
        if (profile.location && profile.location !== 'unknown') {
            return `${baseMessage} in ${profile.location}`;
        }
        
        return baseMessage;
    }

    // Intelligent Recommendation Engine
    generateRecommendations() {
        const profile = this.userProfile;
        const recommendations = [];

        // Course recommendations based on behavior
        if (profile.recentlyViewed.includes('mental-health')) {
            recommendations.push({
                type: 'course',
                title: 'Advanced De-escalation Techniques',
                reason: 'Based on your interest in mental health training',
                priority: 'high',
                action: 'Enroll Now'
            });
        }

        // Automation project recommendations
        if (profile.role === 'hostel_owner' && profile.techSavviness < 3) {
            recommendations.push({
                type: 'automation',
                title: 'Simple Booking Widget',
                reason: 'Perfect first automation project for your property',
                priority: 'medium',
                action: 'Get Quote'
            });
        }

        // United membership recommendations
        if (profile.otaDependency > 70) {
            recommendations.push({
                type: 'united',
                title: 'Join Hostels United',
                reason: 'Reduce your OTA dependency by 40-60%',
                priority: 'high',
                action: 'Join Now'
            });
        }

        return recommendations;
    }

    // Adaptive Learning Algorithm
    setupAdaptiveLearning() {
        // Monitor learning progress and adapt content difficulty
        this.monitorLearningProgress();
        this.adjustContentDifficulty();
        this.provideDynamicFeedback();
    }

    monitorLearningProgress() {
        // Track completion rates, time spent, quiz scores
        const progressData = {
            completionRate: this.calculateCompletionRate(),
            averageTimePerLesson: this.calculateAverageTime(),
            quizPerformance: this.getQuizPerformance(),
            strugglingTopics: this.identifyStrugglingTopics(),
            strengths: this.identifyStrengths()
        };

        this.adaptLearningPath(progressData);
    }

    adaptLearningPath(progressData) {
        // Slow down if struggling
        if (progressData.completionRate < 60) {
            this.insertReviewModules();
            this.reduceLessonComplexity();
        }

        // Speed up if excelling
        if (progressData.completionRate > 90 && progressData.quizPerformance > 85) {
            this.addAdvancedModules();
            this.skipBasicConcepts();
        }

        // Focus on weak areas
        progressData.strugglingTopics.forEach(topic => {
            this.addSupplementaryContent(topic);
        });
    }

    // Behavior Tracking and Analytics
    startBehaviorTracking() {
        this.behaviorTracker.trackPageViews();
        this.behaviorTracker.trackClicks();
        this.behaviorTracker.trackScrollBehavior();
        this.behaviorTracker.trackTimeSpent();
        this.behaviorTracker.trackSearchBehavior();
    }

    // Real-time Personalization
    updatePersonalizationRealTime() {
        setInterval(() => {
            this.updateUserProfile();
            this.refreshRecommendations();
            this.adjustContentLayout();
        }, 30000); // Update every 30 seconds
    }

    // Utility Methods
    getUserId() {
        return localStorage.getItem('userId') || this.generateAnonymousId();
    }

    detectUserRole() {
        // Analyze behavior patterns, page visits, form inputs
        const pageHistory = this.getPageHistory();
        const formData = this.getFormData();

        if (pageHistory.includes('/academy/') && formData.organization) {
            return 'hostel_owner';
        } else if (pageHistory.includes('/automation/')) {
            return 'developer';
        } else if (pageHistory.includes('/united/')) {
            return 'property_owner';
        }

        return 'visitor';
    }

    assessExperience() {
        // Use quiz results, self-reported data, behavior analysis
        const quizResults = this.getQuizResults();
        const selfReported = this.getSelfReportedExperience();
        const behaviorIndicators = this.analyzeBehaviorForExperience();

        return Math.round((quizResults + selfReported + behaviorIndicators) / 3);
    }

    determineLearningStyle() {
        // Analyze how user interacts with different content types
        const videoEngagement = this.getVideoEngagement();
        const readingTime = this.getReadingTime();
        const interactiveUsage = this.getInteractiveUsage();

        if (videoEngagement > 0.8) return 'visual';
        if (readingTime > 300) return 'reading';
        if (interactiveUsage > 0.7) return 'kinesthetic';
        return 'mixed';
    }

    loadUserProfile() {
        return JSON.parse(localStorage.getItem('userProfile')) || {};
    }

    saveUserProfile() {
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
    }
}

// Behavior Tracking Class
class BehaviorTracker {
    constructor() {
        this.events = [];
        this.sessions = [];
        this.currentSession = this.startNewSession();
    }

    trackPageViews() {
        window.addEventListener('load', () => {
            this.recordEvent('page_view', {
                page: window.location.pathname,
                timestamp: Date.now(),
                referrer: document.referrer
            });
        });
    }

    trackClicks() {
        document.addEventListener('click', (e) => {
            this.recordEvent('click', {
                element: e.target.tagName,
                class: e.target.className,
                id: e.target.id,
                text: e.target.textContent?.substring(0, 100),
                timestamp: Date.now()
            });
        });
    }

    trackScrollBehavior() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.recordEvent('scroll', {
                    scrollY: window.scrollY,
                    scrollPercent: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
                    timestamp: Date.now()
                });
            }, 100);
        });
    }

    trackTimeSpent() {
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            this.recordEvent('time_spent', {
                duration: Date.now() - startTime,
                page: window.location.pathname
            });
        });
    }

    recordEvent(type, data) {
        this.events.push({
            type,
            data,
            sessionId: this.currentSession.id
        });

        // Save to localStorage periodically
        if (this.events.length % 10 === 0) {
            this.saveEvents();
        }
    }

    startNewSession() {
        return {
            id: Date.now().toString(),
            startTime: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
    }

    saveEvents() {
        localStorage.setItem('behaviorEvents', JSON.stringify(this.events));
    }
}

// Initialize AI Personalization
const aiPersonalization = new AIPersonalizationEngine();

// Export for global use
window.AIPersonalization = aiPersonalization;

// Auto-update personalization based on behavior
document.addEventListener('DOMContentLoaded', () => {
    aiPersonalization.personalizeContent();
    aiPersonalization.updatePersonalizationRealTime();
});

// API for manual personalization triggers
window.personalizeContent = (element) => {
    aiPersonalization.personalizeContent(element);
};

window.updateRecommendations = () => {
    aiPersonalization.refreshRecommendations();
};

window.getUserProfile = () => {
    return aiPersonalization.userProfile;
};