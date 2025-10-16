'use client';

import { useState, useEffect } from 'react';
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

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const headers = authHelpers.getAuthHeaders();
        const response = await fetch('/api/journal', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch journal entries');
        }

        const data = await response.json();
        setEntries(data.data || []);
      } catch (err) {
        console.error('Error loading journal entries:', err);
        setError('Failed to load journal entries');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      const headers = authHelpers.getAuthHeaders();
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }

      // Remove the entry from the local state
      setEntries(entries.filter(entry => entry.id !== entryId));
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
          <p className="mt-2 text-gray-600">
            Reflect on your thoughts and track your journey
          </p>
        </div>
        <Link href="/journal/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Entry
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Journal Entries */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
            <p className="text-gray-600 mb-6">
              Start your wisdom journey by writing your first journal entry.
            </p>
            <Link href="/journal/new">
              <Button>Write Your First Entry</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {entry.title || 'Untitled Entry'}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{new Date(entry.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      {entry.mood_rating && (
                        <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                          Mood: {entry.mood_rating}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link href={`/journal/${entry.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {entry.content.length > 300 
                      ? `${entry.content.substring(0, 300)}...` 
                      : entry.content
                    }
                  </p>
                  {entry.content.length > 300 && (
                    <Link href={`/journal/${entry.id}`}>
                      <Button variant="link" className="p-0 h-auto">
                        Read more →
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}