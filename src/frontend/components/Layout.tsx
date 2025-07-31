import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">J</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Judge.ca</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/education"
                className={`${
                  isActive('/education')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {t('navigation.education')}
              </Link>
              <Link
                href="/attorneys"
                className={`${
                  isActive('/attorneys')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {t('navigation.findAttorney')}
              </Link>
              <Link
                href="/about"
                className={`${
                  isActive('/about')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {t('navigation.about')}
              </Link>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('auth.register')}
              </Link>
              
              {/* Language Toggle */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => router.push(router.asPath, router.asPath, { locale: 'fr' })}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    router.locale === 'fr'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => router.push(router.asPath, router.asPath, { locale: 'en' })}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    router.locale === 'en'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <span className="text-xl font-bold">Judge.ca</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                {t('footer.description')}
              </p>
              <p className="text-gray-400 text-xs">
                © 2024 Judge.ca. {t('footer.rights')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                {t('footer.quickLinks')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/education" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('navigation.education')}
                  </Link>
                </li>
                <li>
                  <Link href="/attorneys" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('navigation.findAttorney')}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('navigation.about')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                {t('footer.legal')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/legal/privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/confidentiality" className="text-gray-300 hover:text-white text-sm transition-colors">
                    {t('footer.confidentiality')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};