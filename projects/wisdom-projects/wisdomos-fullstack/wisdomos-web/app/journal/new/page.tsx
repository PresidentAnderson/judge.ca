'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle, Button, Input, Textarea, Select } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

export default function NewJournalPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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

      const response = await fetch('/api/journal', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create journal entry');
      }

      router.push('/journal');
    } catch (err: any) {
      console.error('Error creating journal entry:', err);
      setError(err.message || 'Failed to create journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Journal Entry</h1>
        <p className="mt-2 text-gray-600">
          Capture your thoughts, reflections, and insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write Your Entry</CardTitle>
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
              disabled={isLoading}
            />

            <Textarea
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, reflections, or experiences here..."
              required
              disabled={isLoading}
              rows={12}
              className="min-h-64"
            />

            <Select
              label="Mood Rating"
              options={moodOptions}
              value={moodRating}
              onChange={(e) => setMoodRating(e.target.value)}
              disabled={isLoading}
              helperText="How are you feeling today? (1 = terrible, 10 = amazing)"
            />

            <div className="flex items-center justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading || !content.trim()}
              >
                Save Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Journaling Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Be authentic</h4>
              <p className="text-gray-600">Write honestly about your experiences and feelings. This is your private space.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Focus on insights</h4>
              <p className="text-gray-600">What did you learn today? What patterns do you notice in your thoughts or behaviors?</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Express gratitude</h4>
              <p className="text-gray-600">Include things you're grateful for to cultivate a positive mindset.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Set intentions</h4>
              <p className="text-gray-600">What do you want to focus on or improve tomorrow?</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}