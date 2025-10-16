'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, Button, Input, Select, Textarea, LoadingSpinner } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_value?: number;
  life_area_id?: string;
  created_at: string;
  updated_at: string;
}

interface LifeArea {
  id: string;
  name: string;
  color?: string;
}

export default function EditHabitPage({ params }: { params: { id: string } }) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetValue, setTargetValue] = useState('');
  const [lifeAreaId, setLifeAreaId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const headers = authHelpers.getAuthHeaders();
        
        const [habitRes, lifeAreasRes] = await Promise.all([
          fetch(`/api/habits/${params.id}`, { headers }),
          fetch('/api/life-areas', { headers }),
        ]);
        
        if (!habitRes.ok) {
          if (habitRes.status === 404) {
            setError('Habit not found');
          } else {
            throw new Error('Failed to fetch habit');
          }
          return;
        }

        if (!lifeAreasRes.ok) {
          throw new Error('Failed to fetch life areas');
        }

        const [habitData, lifeAreasData] = await Promise.all([
          habitRes.json(),
          lifeAreasRes.json(),
        ]);

        const habitInfo = habitData.data;
        setHabit(habitInfo);
        setName(habitInfo.name || '');
        setDescription(habitInfo.description || '');
        setFrequency(habitInfo.frequency || 'daily');
        setTargetValue(habitInfo.target_value ? habitInfo.target_value.toString() : '');
        setLifeAreaId(habitInfo.life_area_id || '');
        
        setLifeAreas(lifeAreasData.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load habit data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      const headers = {
        ...authHelpers.getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        life_area_id: lifeAreaId || undefined,
      };

      if (targetValue) {
        payload.target_value = parseInt(targetValue);
      }

      const response = await fetch(`/api/habits/${params.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update habit');
      }

      router.push('/habits');
    } catch (err: any) {
      console.error('Error updating habit:', err);
      setError(err.message || 'Failed to update habit');
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

  if (error && !habit) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/habits">
            <Button variant="outline">← Back to Habits</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/habits">
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              ← Back to Habits
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Habit</h1>
        <p className="mt-2 text-gray-600">
          Update your habit details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Habit</CardTitle>
          {habit && (
            <p className="text-sm text-gray-500">
              Created on {new Date(habit.created_at).toLocaleDateString('en-US', {
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
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning meditation, Drink water, Exercise"
              required
              disabled={isSaving}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Frequency"
                options={frequencyOptions}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                disabled={isSaving}
              />
              
              <Input
                label="Target Value (optional)"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g., 8 (for 8 glasses of water)"
                disabled={isSaving}
              />
            </div>

            <Select
              label="Life Area (optional)"
              options={[
                { value: '', label: 'No category' },
                ...lifeAreas.map(area => ({ value: area.id, label: area.name }))
              ]}
              value={lifeAreaId}
              onChange={(e) => setLifeAreaId(e.target.value)}
              disabled={isSaving}
            />

            <Textarea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your habit and why it's important to you..."
              disabled={isSaving}
              rows={4}
            />

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link href="/habits">
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
                disabled={isSaving || !name.trim()}
              >
                Update Habit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}