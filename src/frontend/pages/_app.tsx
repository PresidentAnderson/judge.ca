import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { appWithTranslation } from 'next-i18next';
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { initializeWebVitals, measureResourceLoading } from '../../../lib/performance';
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
    }
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
      <Analytics />
    </>
  );
}

export default appWithTranslation(MyApp);