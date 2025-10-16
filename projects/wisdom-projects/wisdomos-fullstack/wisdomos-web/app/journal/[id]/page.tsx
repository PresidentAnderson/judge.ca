'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, Button, LoadingSpinner } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood_rating?: number;
  created_at: string;
  updated_at: string;
}

export default function JournalEntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadEntry = async () => {
      try {
        setIsLoading(true);
        const headers = authHelpers.getAuthHeaders();
        const response = await fetch(`/api/journal/${params.id}`, { headers });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Journal entry not found');
          } else {
            throw new Error('Failed to fetch journal entry');
          }
          return;
        }

        const data = await response.json();
        setEntry(data.data);
      } catch (err) {
        console.error('Error loading journal entry:', err);
        setError('Failed to load journal entry');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [params.id]);

  const handleDeleteEntry = async () => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      const headers = authHelpers.getAuthHeaders();
      const response = await fetch(`/api/journal/${params.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }

      router.push('/journal');
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      alert('Failed to delete journal entry');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error || 'Journal entry not found'}
        </div>
        <div className="mt-4">
          <Link href="/journal">
            <Button variant="outline">← Back to Journal</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Navigation */}
      <div className="mb-8">
        <Link href="/journal">
          <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
            ← Back to Journal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {entry.title || 'Untitled Entry'}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {entry.created_at !== entry.updated_at && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Updated {new Date(entry.updated_at).toLocaleDateString()}
                  </span>
                )}
                {entry.mood_rating && (
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                    Mood: {entry.mood_rating}/10
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Link href={`/journal/${entry.id}/edit`}>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEntry}
                className="text-error-600 border-error-200 hover:bg-error-50 hover:border-error-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="prose max-w-none">
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
              {entry.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Entry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Created</label>
              <p className="text-gray-600">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Word Count</label>
              <p className="text-gray-600">{entry.content.split(/\s+/).length} words</p>
            </div>
            {entry.created_at !== entry.updated_at && (
              <div>
                <label className="font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-600">
                  {new Date(entry.updated_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
            {entry.mood_rating && (
              <div>
                <label className="font-medium text-gray-700">Mood Rating</label>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < entry.mood_rating! ? 'bg-primary-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">({entry.mood_rating}/10)</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}