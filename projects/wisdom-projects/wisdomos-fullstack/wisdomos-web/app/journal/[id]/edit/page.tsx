'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, Button, Input, Textarea, Select, LoadingSpinner } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood_rating?: number;
  created_at: string;
  updated_at: string;
}

export default function EditJournalPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const moodOptions = [
    { value: '', label: 'Select mood (optional)' },
    { value: '1', label: '1 - Terrible' },
    { value: '2', label: '2 - Bad' },
    { value: '3', label: '3 - Poor' },
    { value: '4', label: '4 - Below Average' },
    { value: '5', label: '5 - Average' },
    { value: '6', label: '6 - Good' },
    { value: '7', label: '7 - Very Good' },
    { value: '8', label: '8 - Great' },
    { value: '9', label: '9 - Excellent' },
    { value: '10', label: '10 - Amazing' },
  ];

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
        const entryData = data.data;
        
        setEntry(entryData);
        setTitle(entryData.title || '');
        setContent(entryData.content || '');
        setMoodRating(entryData.mood_rating ? entryData.mood_rating.toString() : '');
      } catch (err) {
        console.error('Error loading journal entry:', err);
        setError('Failed to load journal entry');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      if (!content.trim()) {
        setError('Content is required');
        return;
      }

      const headers = {
        ...authHelpers.getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const payload: any = {
        title: title.trim() || undefined,
        content: content.trim(),
      };

      if (moodRating) {
        payload.mood_rating = parseInt(moodRating);
      }

      const response = await fetch(`/api/journal/${params.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update journal entry');
      }

      router.push(`/journal/${params.id}`);
    } catch (err: any) {
      console.error('Error updating journal entry:', err);
      setError(err.message || 'Failed to update journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error}
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link href={`/journal/${params.id}`}>
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              ← Back to Entry
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Journal Entry</h1>
        <p className="mt-2 text-gray-600">
          Update your thoughts and reflections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Your Entry</CardTitle>
          {entry && (
            <p className="text-sm text-gray-500">
              Originally created on {new Date(entry.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              disabled={isSaving}
            />

            <Textarea
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, reflections, or experiences here..."
              required
              disabled={isSaving}
              rows={12}
              className="min-h-64"
            />

            <Select
              label="Mood Rating"
              options={moodOptions}
              value={moodRating}
              onChange={(e) => setMoodRating(e.target.value)}
              disabled={isSaving}
              helperText="How are you feeling today? (1 = terrible, 10 = amazing)"
            />

            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-gray-500">
                {content.split(/\s+/).length} words
              </div>
              <div className="flex items-center space-x-4">
                <Link href={`/journal/${params.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={isSaving || !content.trim()}
                >
                  Update Entry
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}