import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery } from 'react-query';

interface UserMatch {
  id: string;
  attorneyName: string;
  firmName?: string;
  practiceArea: string;
  matchScore: number;
  status: 'proposed' | 'accepted' | 'rejected';
  createdAt: string;
  attorneyPhoto?: string;
  hourlyRate: { min: number; max: number };
}

const UserDashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [activeTab, setActiveTab] = useState('matches');

  const { data: matches } = useQuery<UserMatch[]>('userMatches', async () => {
    const response = await fetch('/api/matches/my-matches', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    return data.matches;
  });

  const pendingMatches = matches?.filter(m => m.status === 'proposed') || [];
  const activeMatches = matches?.filter(m => m.status === 'accepted') || [];
  const pastMatches = matches?.filter(m => m.status === 'rejected') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">{t('userDashboard')}</h1>
            <Link href="/user/onboarding">
              <button className="btn-primary">
                {t('findNewAttorney')}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">{t('stats.pendingMatches')}</h3>
            <p className="text-3xl font-bold text-blue-600">{pendingMatches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">{t('stats.activeMatches')}</h3>
            <p className="text-3xl font-bold text-green-600">{activeMatches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">{t('stats.totalMatches')}</h3>
            <p className="text-3xl font-bold text-gray-600">{matches?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {['matches', 'active', 'past'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t(`tabs.${tab}`)}
                  {tab === 'matches' && pendingMatches.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                      {pendingMatches.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'matches' && (
              <div className="space-y-4">
                {pendingMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">{t('noPendingMatches')}</p>
                    <Link href="/user/onboarding">
                      <button className="btn-primary">
                        {t('findAttorney')}
                      </button>
                    </Link>
                  </div>
                ) : (
                  pendingMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            {match.attorneyPhoto ? (
                              <img src={match.attorneyPhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium">{match.attorneyName}</h3>
                            {match.firmName && (
                              <p className="text-gray-600">{match.firmName}</p>
                            )}
                            <p className="text-sm text-gray-500">{match.practiceArea}</p>
                            <p className="text-sm text-green-600">
                              ${match.hourlyRate.min} - ${match.hourlyRate.max}/hr
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <span className="text-sm text-gray-500">{t('matchScore')}</span>
                            <div className="text-lg font-bold text-blue-600">{match.matchScore}%</div>
                          </div>
                          <div className="space-x-2">
                            <Link href={`/user/matches/${match.id}`}>
                              <button className="btn-primary">
                                {t('viewDetails')}
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-4">
                {activeMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t('noActiveMatches')}</p>
                  </div>
                ) : (
                  activeMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{match.attorneyName}</h3>
                          <p className="text-gray-600">{match.practiceArea}</p>
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {t('accepted')}
                          </span>
                        </div>
                        <div className="space-x-2">
                          <button className="btn-secondary">
                            {t('sendMessage')}
                          </button>
                          <button className="btn-primary">
                            {t('leaveReview')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div className="space-y-4">
                {pastMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t('noPastMatches')}</p>
                  </div>
                ) : (
                  pastMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-6 opacity-75">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{match.attorneyName}</h3>
                          <p className="text-gray-600">{match.practiceArea}</p>
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {t('notMatched')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['dashboard', 'common'])),
    },
  };
};

export default UserDashboard;