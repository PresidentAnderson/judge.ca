import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const GuideDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation(['education', 'common']);

  const guideContent = {
    'choosing-attorney': {
      title: t('guides.choosingAttorney.title'),
      sections: [
        {
          heading: t('guides.choosingAttorney.sections.qualifications.heading'),
          content: t('guides.choosingAttorney.sections.qualifications.content'),
          checklist: [
            t('guides.choosingAttorney.sections.qualifications.checklist.0'),
            t('guides.choosingAttorney.sections.qualifications.checklist.1'),
            t('guides.choosingAttorney.sections.qualifications.checklist.2'),
            t('guides.choosingAttorney.sections.qualifications.checklist.3')
          ]
        },
        {
          heading: t('guides.choosingAttorney.sections.experience.heading'),
          content: t('guides.choosingAttorney.sections.experience.content'),
          tips: [
            t('guides.choosingAttorney.sections.experience.tips.0'),
            t('guides.choosingAttorney.sections.experience.tips.1'),
            t('guides.choosingAttorney.sections.experience.tips.2')
          ]
        },
        {
          heading: t('guides.choosingAttorney.sections.communication.heading'),
          content: t('guides.choosingAttorney.sections.communication.content'),
          warning: t('guides.choosingAttorney.sections.communication.warning')
        },
        {
          heading: t('guides.choosingAttorney.sections.fees.heading'),
          content: t('guides.choosingAttorney.sections.fees.content'),
          table: {
            headers: [t('feeType'), t('description'), t('bestFor')],
            rows: [
              [t('hourly'), t('hourlyDesc'), t('hourlyBest')],
              [t('fixed'), t('fixedDesc'), t('fixedBest')],
              [t('contingency'), t('contingencyDesc'), t('contingencyBest')]
            ]
          }
        },
        {
          heading: t('guides.choosingAttorney.sections.questions.heading'),
          content: t('guides.choosingAttorney.sections.questions.content'),
          questions: [
            t('guides.choosingAttorney.sections.questions.list.0'),
            t('guides.choosingAttorney.sections.questions.list.1'),
            t('guides.choosingAttorney.sections.questions.list.2'),
            t('guides.choosingAttorney.sections.questions.list.3'),
            t('guides.choosingAttorney.sections.questions.list.4'),
            t('guides.choosingAttorney.sections.questions.list.5')
          ]
        }
      ]
    },
    'red-flags': {
      title: t('guides.redFlags.title'),
      sections: [
        {
          heading: t('guides.redFlags.sections.immediate.heading'),
          content: t('guides.redFlags.sections.immediate.content'),
          flags: [
            {
              flag: t('guides.redFlags.sections.immediate.flags.0.flag'),
              explanation: t('guides.redFlags.sections.immediate.flags.0.explanation')
            },
            {
              flag: t('guides.redFlags.sections.immediate.flags.1.flag'),
              explanation: t('guides.redFlags.sections.immediate.flags.1.explanation')
            },
            {
              flag: t('guides.redFlags.sections.immediate.flags.2.flag'),
              explanation: t('guides.redFlags.sections.immediate.flags.2.explanation')
            }
          ]
        },
        {
          heading: t('guides.redFlags.sections.behavior.heading'),
          content: t('guides.redFlags.sections.behavior.content'),
          flags: [
            {
              flag: t('guides.redFlags.sections.behavior.flags.0.flag'),
              explanation: t('guides.redFlags.sections.behavior.flags.0.explanation')
            },
            {
              flag: t('guides.redFlags.sections.behavior.flags.1.flag'),
              explanation: t('guides.redFlags.sections.behavior.flags.1.explanation')
            }
          ]
        },
        {
          heading: t('guides.redFlags.sections.whatToDo.heading'),
          content: t('guides.redFlags.sections.whatToDo.content'),
          steps: [
            t('guides.redFlags.sections.whatToDo.steps.0'),
            t('guides.redFlags.sections.whatToDo.steps.1'),
            t('guides.redFlags.sections.whatToDo.steps.2'),
            t('guides.redFlags.sections.whatToDo.steps.3')
          ]
        }
      ]
    }
  };

  const currentGuide = guideContent[id as keyof typeof guideContent];

  if (!currentGuide) {
    return <div>Guide not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/education">
          <a className="inline-flex items-center text-blue-600 hover:underline mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToEducation')}
          </a>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{currentGuide.title}</h1>

          {currentGuide.sections.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
              <p className="text-gray-700 mb-4">{section.content}</p>

              {section.checklist && (
                <div className="bg-blue-50 p-6 rounded-lg mb-4">
                  <h3 className="font-semibold mb-3">{t('checklist')}</h3>
                  <ul className="space-y-2">
                    {section.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.tips && (
                <div className="bg-green-50 p-6 rounded-lg mb-4">
                  <h3 className="font-semibold mb-3">{t('tips')}</h3>
                  <ul className="space-y-2">
                    {section.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.warning && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{section.warning}</p>
                    </div>
                  </div>
                </div>
              )}

              {section.table && (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {section.table.headers.map((header, idx) => (
                          <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {section.table.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.questions && (
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <h3 className="font-semibold mb-3">{t('questionsToAsk')}</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {section.questions.map((question, idx) => (
                      <li key={idx} className="text-gray-700">{question}</li>
                    ))}
                  </ol>
                </div>
              )}

              {section.flags && (
                <div className="space-y-4 mb-4">
                  {section.flags.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-4">
                      <div className="font-semibold text-red-700">🚩 {item.flag}</div>
                      <p className="text-gray-600 mt-1">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.steps && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">{t('steps')}</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {section.steps.map((step, idx) => (
                      <li key={idx} className="text-gray-700">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}

          <div className="mt-12 p-6 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">{t('needHelp')}</h3>
            <p className="text-gray-700 mb-4">{t('getMatched')}</p>
            <Link href="/user/onboarding">
              <button className="btn-primary">
                {t('findAttorney')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const guides = ['choosing-attorney', 'first-meeting', 'red-flags', 'legal-fees', 'your-rights', 'complaint-process'];
  const paths = guides.flatMap(id => [
    { params: { id }, locale: 'fr' },
    { params: { id }, locale: 'en' }
  ]);

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['education', 'common'])),
    },
  };
};

export default GuideDetail;