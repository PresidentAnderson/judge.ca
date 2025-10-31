import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery } from 'react-query';

interface DashboardStats {
  profileViews: number;
  totalMatches: number;
  acceptedMatches: number;
  averageRating: number;
  reviewCount: number;
  monthlyRevenue: number;
}

interface RecentMatch {
  id: string;
  userName: string;
  practiceArea: string;
  urgency: string;
  createdAt: string;
  status: 'proposed' | 'accepted' | 'rejected';
}

const AttorneyDashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useQuery<DashboardStats>('attorneyStats', async () => {
    const response = await fetch('/api/attorneys/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  });

  const { data: recentMatches } = useQuery<RecentMatch[]>('recentMatches', async () => {
    const response = await fetch('/api/matches/my-matches?limit=5', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    return data.matches;
  });

  const statCards = [
    {
      title: t('stats.profileViews'),
      value: stats?.profileViews || 0,
      change: '+12%',
      icon: '👁️'
    },
    {
      title: t('stats.totalMatches'),
      value: stats?.totalMatches || 0,
      change: '+8%',
      icon: '🤝'
    },
    {
      title: t('stats.acceptRate'),
      value: stats?.totalMatches ? `${Math.round((stats.acceptedMatches / stats.totalMatches) * 100)}%` : '0%',
      change: '+3%',
      icon: '✅'
    },
    {
      title: t('stats.averageRating'),
      value: stats?.averageRating ? `${stats.averageRating}/5` : 'N/A',
      subtitle: `(${stats?.reviewCount || 0} ${t('reviews')})`,
      icon: '⭐'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">{t('attorneyDashboard')}</h1>
            <div className="flex space-x-4">
              <Link href="/attorney/profile">
                <button className="btn-secondary">
                  {t('editProfile')}
                </button>
              </Link>
              <button className="btn-primary">
                {t('availability')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{stat.icon}</span>
                {stat.change && (
                  <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">{t('recentMatches')}</h2>
              </div>
              <div className="divide-y">
                {recentMatches?.map((match) => (
                  <div key={match.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{match.userName}</h3>
                        <p className="text-sm text-gray-500">{match.practiceArea}</p>
                        <p className="text-sm text-gray-500">
                          {t(`urgency.${match.urgency}`)} • {new Date(match.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {match.status === 'proposed' && (
                          <>
                            <button
                              onClick={() => router.push(`/attorney/matches/${match.id}`)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t('review')}
                            </button>
                          </>
                        )}
                        {match.status === 'accepted' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {t('accepted')}
                          </span>
                        )}
                        {match.status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            {t('rejected')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t">
                <Link href="/attorney/matches">
                  <a className="text-blue-600 hover:underline">{t('viewAllMatches')}</a>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('quickActions')}</h3>
              <div className="space-y-3">
                <Link href="/attorney/availability">
                  <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50">
                    📅 {t('updateAvailability')}
                  </button>
                </Link>
                <Link href="/attorney/rates">
                  <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50">
                    💰 {t('updateRates')}
                  </button>
                </Link>
                <Link href="/attorney/documents">
                  <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50">
                    📄 {t('manageDocuments')}
                  </button>
                </Link>
                <Link href="/attorney/reviews">
                  <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50">
                    ⭐ {t('viewReviews')}
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('profileCompleteness')}</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('complete')}</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('completeProfileMessage')}
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('basicInfo')}
                </li>
                <li className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('practiceAreas')}
                </li>
                <li className="flex items-center text-yellow-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {t('addProfilePhoto')}
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {t('addCertifications')}
                </li>
              </ul>
            </div>
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

export default AttorneyDashboard;