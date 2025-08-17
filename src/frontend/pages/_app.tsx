import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { appWithTranslation } from 'next-i18next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { initializeWebVitals, measureResourceLoading } from '../../../lib/performance';
import { analytics, trackError } from '../../../lib/analytics';
import ConsentManager from '../../../components/analytics/ConsentManager';
import '../styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize performance monitoring
    initializeWebVitals();
    measureResourceLoading();
    
    // Initialize analytics after consent check
    const initAnalytics = async () => {
      try {
        // Check if user has given consent
        const hasConsent = localStorage.getItem('analytics-consent') === 'true';
        if (hasConsent) {
          await analytics.initialize();
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        trackError(error as Error, 'analytics_initialization');
      }
    };

    initAnalytics();
    
    // Preload critical resources
    if (typeof window !== 'undefined') {
      // Preload fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      fontLink.as = 'style';
      fontLink.onload = () => {
        fontLink.rel = 'stylesheet';
      };
      document.head.appendChild(fontLink);
      
      // Service Worker registration for production
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      }

      // Global error handler for unhandled errors
      window.addEventListener('error', (event) => {
        trackError(event.error, 'unhandled_error');
      });

      // Global error handler for unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        trackError(new Error(event.reason), 'unhandled_promise_rejection');
      });
    }
  }, []);

  const handleConsentChange = (consent: boolean) => {
    if (consent) {
      analytics.initialize();
    }
  };

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
      <ConsentManager onConsentChange={handleConsentChange} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default appWithTranslation(MyApp);