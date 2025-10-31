import React, { useState, useEffect } from 'react';
import { X, Shield, Eye, BarChart3, MessageSquare } from 'lucide-react';
import { analytics, AnalyticsEvents } from '@/lib/analytics';

interface ConsentManagerProps {
  onConsentChange?: (consent: boolean) => void;
}

interface ConsentSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ onConsentChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentSettings>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    // Check if user has already made a consent choice
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      setIsVisible(true);
    } else {
      const parsedConsent = JSON.parse(savedConsent);
      setConsent(parsedConsent);
      // Initialize analytics if consent was given
      if (parsedConsent.analytics) {
        analytics.setConsent(true);
        analytics.initialize();
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    saveConsent(newConsent);
  };

  const handleAcceptNecessary = () => {
    const newConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    saveConsent(newConsent);
  };

  const handleCustomSave = () => {
    saveConsent(consent);
  };

  const saveConsent = (consentSettings: ConsentSettings) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consentSettings));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    // Set analytics consent
    analytics.setConsent(consentSettings.analytics);
    
    if (consentSettings.analytics) {
      analytics.initialize();
    }

    setIsVisible(false);
    onConsentChange?.(consentSettings.analytics);

    // Track consent choice
    if (consentSettings.analytics) {
      analytics.track(AnalyticsEvents.CONSENT_GIVEN, {
        event_category: 'privacy',
        event_label: 'cookie_consent',
        value: 1,
      });
    }
  };

  const handleConsentChange = (type: keyof ConsentSettings, value: boolean) => {
    if (type === 'necessary') {return;} // Cannot disable necessary cookies
    setConsent(prev => ({ ...prev, [type]: value }));
  };

  if (!isVisible) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Privacy & Cookie Settings</h2>
                <p className="text-gray-600">We respect your privacy and data protection rights</p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              Judge.ca uses cookies and similar technologies to provide you with a better experience, 
              analyze website traffic, and personalize content. You can choose which types of cookies 
              to allow. Your privacy is important to us, and you can change these settings at any time.
            </p>
          </div>

          {!showDetails ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={handleAcceptAll}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Necessary Only
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Customize Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Necessary Cookies</h3>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  These cookies are essential for the website to function properly. They enable core functionality 
                  such as security, authentication, and accessibility features. These cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Help us understand how visitors interact with our website by collecting and reporting 
                  information anonymously. This includes Google Analytics, performance monitoring, and error tracking.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Used to track visitors across websites and display relevant advertisements. 
                  This includes Facebook Pixel, Google Ads conversion tracking, and remarketing features.
                </p>
              </div>

              {/* Personalization Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Personalization Cookies</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.personalization}
                      onChange={(e) => handleConsentChange('personalization', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Enable personalized content and features such as chat widgets, customized user experience, 
                  and preference settings to improve your interaction with our services.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleCustomSave}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex-1"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              By continuing to use our website, you acknowledge that you have read and understood our{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>{' '}
              and{' '}
              <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>.
              You can change your preferences at any time in the privacy settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentManager;