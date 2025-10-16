'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button, LoadingSpinner } from '@/components/ui';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { authHelpers } from '@/lib/auth';

interface DashboardStats {
  totalJournalEntries: number;
  totalHabits: number;
  totalLifeAreas: number;
  recentJournalEntries: any[];
  recentHabits: any[];
  averageMoodRating: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/auth/login';
          return;
        }
        setUser(currentUser);

        // Fetch dashboard stats from APIs
        const headers = authHelpers.getAuthHeaders();
        
        const [journalRes, habitsRes, lifeAreasRes] = await Promise.all([
          fetch('/api/journal?limit=5', { headers }),
          fetch('/api/habits', { headers }),
          fetch('/api/life-areas', { headers }),
        ]);

        if (!journalRes.ok || !habitsRes.ok || !lifeAreasRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [journalData, habitsData, lifeAreasData] = await Promise.all([
          journalRes.json(),
          habitsRes.json(),
          lifeAreasRes.json(),
        ]);

        // Calculate average mood rating
        const journalEntries = journalData.data || [];
        const moodRatings = journalEntries
          .filter((entry: any) => entry.mood_rating)
          .map((entry: any) => entry.mood_rating);
        
        const averageMoodRating = moodRatings.length > 0 
          ? moodRatings.reduce((sum: number, rating: number) => sum + rating, 0) / moodRatings.length 
          : 0;

        setStats({
          totalJournalEntries: journalEntries.length,
          totalHabits: (habitsData.data || []).length,
          totalLifeAreas: (lifeAreasData.data || []).length,
          recentJournalEntries: journalEntries.slice(0, 3),
          recentHabits: (habitsData.data || []).slice(0, 3),
          averageMoodRating: Math.round(averageMoodRating * 10) / 10,
        });
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'Friend'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's your wisdom journey overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Journal Entries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalJournalEntries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Habits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalHabits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Life Areas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalLifeAreas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 003 0v-1a1.5 1.5 0 011.5-1.5H18m-3-3.75V3a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5h-4.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg. Mood</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.averageMoodRating ? `${stats.averageMoodRating}/10` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Journal Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Journal Entries</CardTitle>
            <CardDescription>Your latest thoughts and reflections</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentJournalEntries.length ? (
              <div className="space-y-4">
                {stats.recentJournalEntries.map((entry: any) => (
                  <div key={entry.id} className="border-l-4 border-primary-200 pl-4 py-2">
                    <h4 className="font-medium text-gray-900">
                      {entry.title || 'Untitled Entry'}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {entry.content.length > 100 
                        ? `${entry.content.substring(0, 100)}...` 
                        : entry.content
                      }
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                      {entry.mood_rating && (
                        <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                          Mood: {entry.mood_rating}/10
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link href="/journal">
                    <Button variant="outline" size="sm">
                      View All Entries
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No journal entries yet</p>
                <Link href="/journal">
                  <Button>Write Your First Entry</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Habits */}
        <Card>
          <CardHeader>
            <CardTitle>Your Habits</CardTitle>
            <CardDescription>Track your daily practices</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentHabits.length ? (
              <div className="space-y-4">
                {stats.recentHabits.map((habit: any) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{habit.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{habit.frequency}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        habit.frequency === 'daily' ? 'bg-green-100 text-green-800' :
                        habit.frequency === 'weekly' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {habit.frequency}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link href="/habits">
                    <Button variant="outline" size="sm">
                      Manage Habits
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No habits created yet</p>
                <Link href="/habits">
                  <Button>Create Your First Habit</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your daily practices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/journal">
                <Button className="w-full justify-start" variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  New Journal Entry
                </Button>
              </Link>
              
              <Link href="/habits">
                <Button className="w-full justify-start" variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Track Habits
                </Button>
              </Link>
              
              <Link href="/life-areas">
                <Button className="w-full justify-start" variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Life Areas
                </Button>
              </Link>
              
              <Link href="/profile">
                <Button className="w-full justify-start" variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}