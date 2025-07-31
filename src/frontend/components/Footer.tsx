import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = event.target.value;
    window.location.href = `/footer_${selectedLanguage}.html`;
  };

  useEffect(() => {
    // Load HubSpot script if not already loaded
    if (!window.hbspt) {
      const script = document.createElement('script');
      script.src = '//js.hsforms.net/forms/embed/v2.js';
      script.charset = 'utf-8';
      script.type = 'text/javascript';
      script.onload = () => {
        if (window.hbspt) {
          window.hbspt.forms.create({
            region: 'na1',
            portalId: '43986063',
            formId: '331de0e6-2455-4516-b914-d238435ee0f9',
            target: '#hubspotForm'
          });
        }
      };
      document.head.appendChild(script);
    } else {
      // HubSpot is already loaded
      window.hbspt.forms.create({
        region: 'na1',
        portalId: '43986063',
        formId: '331de0e6-2455-4516-b914-d238435ee0f9',
        target: '#hubspotForm'
      });
    }
  }, []);

  return (
    <footer className={`${isDarkMode ? 'bg-black' : 'bg-gray-900'} text-white`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Clients Panel */}
          <div className="panel">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              ⚖️ {t('footer.clients')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/find-attorney"><a className="text-gray-300 hover:text-white">{t('footer.findAttorney')}</a></Link></li>
              <li><Link href="/consultation"><a className="text-gray-300 hover:text-white">Legal Consultation</a></Link></li>
              <li><Link href="/case-tracking"><a className="text-gray-300 hover:text-white">Case Tracking</a></Link></li>
              <li><Link href="/legal-resources"><a className="text-gray-300 hover:text-white">Legal Resources</a></Link></li>
              <li><Link href="/client-support"><a className="text-gray-300 hover:text-white">Client Support</a></Link></li>
              <li><Link href="/billing"><a className="text-gray-300 hover:text-white">Billing Portal</a></Link></li>
            </ul>
          </div>

          {/* Legal Community Panel */}
          <div className="panel">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              🏛️ {t('footer.legalCommunity')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/attorney/network"><a className="text-gray-300 hover:text-white">Attorney Network</a></Link></li>
              <li><Link href="/legal-news"><a className="text-gray-300 hover:text-white">Legal News & Updates</a></Link></li>
              <li><Link href="/case-studies"><a className="text-gray-300 hover:text-white">Case Studies</a></Link></li>
              <li><Link href="/legal-education"><a className="text-gray-300 hover:text-white">Continuing Education</a></Link></li>
              <li><Link href="/professional-development"><a className="text-gray-300 hover:text-white">Professional Development</a></Link></li>
            </ul>
          </div>

          {/* Language & Settings Panel */}
          <div className="panel">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              🌐 {t('footer.language')}
            </h4>
            <select 
              onChange={handleLanguageChange}
              className="w-full px-3 py-2 mb-4 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="hi">हिन्दी</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
            </select>
            <button 
              onClick={toggleDarkMode}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Judge.ca</h3>
            <p className="text-gray-300 mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Signup & HubSpot Form */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">{t('footer.newsletter.title')}</h4>
              <p className="text-gray-300">{t('footer.newsletter.description')}</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors">
                {t('footer.newsletter.subscribe')}
              </button>
            </div>
          </div>
          
          {/* HubSpot Form */}
          <div className="mt-6">
            <div id="hubspotForm" className="max-w-md mx-auto"></div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 Judge.ca. {t('footer.copyright')}
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <img src="/icons/quebec.svg" alt="Quebec" className="w-6 h-6" />
              <span className="text-gray-400 text-sm">{t('footer.quebec')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400 text-sm">{t('footer.secure')}</span>
            </div>
          </div>
        </div>

        {/* HR/Investor Links */}
        <div className="border-t border-gray-700 mt-6 pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/corporate/hr">
              <a className="text-gray-400 hover:text-white flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                {t('footer.corporate.hr')}
              </a>
            </Link>
            <Link href="/corporate/investors">
              <a className="text-gray-400 hover:text-white flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
                {t('footer.corporate.investors')}
              </a>
            </Link>
            <Link href="/corporate/partners">
              <a className="text-gray-400 hover:text-white flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('footer.corporate.partners')}
              </a>
            </Link>
            <Link href="/corporate/media">
              <a className="text-gray-400 hover:text-white flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {t('footer.corporate.media')}
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;