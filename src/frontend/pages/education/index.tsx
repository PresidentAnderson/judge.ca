import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const EducationHub: React.FC = () => {
  const { t } = useTranslation(['education', 'common']);
  const [activeTab, setActiveTab] = useState('guides');

  const guides = [
    {
      id: 'choosing-attorney',
      title: t('guides.choosingAttorney.title'),
      description: t('guides.choosingAttorney.description'),
      readTime: '10 min',
      icon: '⚖️'
    },
    {
      id: 'first-meeting',
      title: t('guides.firstMeeting.title'),
      description: t('guides.firstMeeting.description'),
      readTime: '5 min',
      icon: '🤝'
    },
    {
      id: 'red-flags',
      title: t('guides.redFlags.title'),
      description: t('guides.redFlags.description'),
      readTime: '7 min',
      icon: '🚩'
    },
    {
      id: 'legal-fees',
      title: t('guides.legalFees.title'),
      description: t('guides.legalFees.description'),
      readTime: '8 min',
      icon: '💰'
    },
    {
      id: 'your-rights',
      title: t('guides.yourRights.title'),
      description: t('guides.yourRights.description'),
      readTime: '12 min',
      icon: '📜'
    },
    {
      id: 'complaint-process',
      title: t('guides.complaintProcess.title'),
      description: t('guides.complaintProcess.description'),
      readTime: '6 min',
      icon: '📝'
    }
  ];

  const glossaryTerms = [
    { term: 'Retainer', definition: t('glossary.retainer') },
    { term: 'Contingency Fee', definition: t('glossary.contingencyFee') },
    { term: 'Pro Bono', definition: t('glossary.proBono') },
    { term: 'Bar Association', definition: t('glossary.barAssociation') },
    { term: 'Conflict of Interest', definition: t('glossary.conflictOfInterest') },
    { term: 'Attorney-Client Privilege', definition: t('glossary.attorneyClientPrivilege') }
  ];

  const faqs = [
    {
      question: t('faqs.q1.question'),
      answer: t('faqs.q1.answer')
    },
    {
      question: t('faqs.q2.question'),
      answer: t('faqs.q2.answer')
    },
    {
      question: t('faqs.q3.question'),
      answer: t('faqs.q3.answer')
    },
    {
      question: t('faqs.q4.question'),
      answer: t('faqs.q4.answer')
    },
    {
      question: t('faqs.q5.question'),
      answer: t('faqs.q5.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'guides'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('tabs.guides')}
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'glossary'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('tabs.glossary')}
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'faqs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('tabs.faqs')}
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('tabs.tools')}
          </button>
        </div>

        {activeTab === 'guides' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Link key={guide.id} href={`/education/guides/${guide.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-4xl mb-4">{guide.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{guide.title}</h3>
                  <p className="text-gray-600 mb-4">{guide.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {guide.readTime}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'glossary' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">{t('glossary.title')}</h2>
            <div className="space-y-6">
              {glossaryTerms.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold mb-2">{item.term}</h3>
                  <p className="text-gray-600">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">{t('faqs.title')}</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex justify-between items-center cursor-pointer list-none p-4 hover:bg-gray-50 rounded-lg">
                    <span className="font-medium pr-4">{faq.question}</span>
                    <svg
                      className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">{t('tools.decisionTree.title')}</h3>
              <p className="text-gray-600 mb-4">{t('tools.decisionTree.description')}</p>
              <Link href="/education/tools/decision-tree">
                <button className="btn-primary">
                  {t('tools.decisionTree.button')}
                </button>
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">{t('tools.checklist.title')}</h3>
              <p className="text-gray-600 mb-4">{t('tools.checklist.description')}</p>
              <Link href="/education/tools/checklist">
                <button className="btn-primary">
                  {t('tools.checklist.button')}
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">{t('tools.costCalculator.title')}</h3>
              <p className="text-gray-600 mb-4">{t('tools.costCalculator.description')}</p>
              <Link href="/education/tools/cost-calculator">
                <button className="btn-primary">
                  {t('tools.costCalculator.button')}
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">{t('tools.documentPrep.title')}</h3>
              <p className="text-gray-600 mb-4">{t('tools.documentPrep.description')}</p>
              <Link href="/education/tools/document-prep">
                <button className="btn-primary">
                  {t('tools.documentPrep.button')}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['education', 'common'])),
    },
  };
};

export default EducationHub;