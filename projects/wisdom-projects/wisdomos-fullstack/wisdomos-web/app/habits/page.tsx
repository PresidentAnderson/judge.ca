'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button, LoadingSpinner, Input, Select, Textarea } from '@/components/ui';
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

interface HabitTracking {
  id: string;
  habit_id: string;
  completed_at: string;
  value?: number;
  notes?: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [habitTracking, setHabitTracking] = useState<Record<string, HabitTracking[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newTargetValue, setNewTargetValue] = useState('');
  const [newLifeAreaId, setNewLifeAreaId] = useState('');

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
        
        const [habitsRes, lifeAreasRes, trackingRes] = await Promise.all([
          fetch('/api/habits', { headers }),
          fetch('/api/life-areas', { headers }),
          fetch('/api/habits/track', { headers }),
        ]);
        
        if (!habitsRes.ok || !lifeAreasRes.ok || !trackingRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [habitsData, lifeAreasData, trackingData] = await Promise.all([
          habitsRes.json(),
          lifeAreasRes.json(),
          trackingRes.json(),
        ]);

        setHabits(habitsData.data || []);
        setLifeAreas(lifeAreasData.data || []);
        
        // Group tracking data by habit_id
        const trackingByHabit: Record<string, HabitTracking[]> = {};
        (trackingData.data || []).forEach((tracking: HabitTracking) => {
          if (!trackingByHabit[tracking.habit_id]) {
            trackingByHabit[tracking.habit_id] = [];
          }
          trackingByHabit[tracking.habit_id].push(tracking);
        });
        setHabitTracking(trackingByHabit);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load habits data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      if (!newName.trim()) {
        setError('Name is required');
        return;
      }

      const headers = {
        ...authHelpers.getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const payload: any = {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        frequency: newFrequency,
        life_area_id: newLifeAreaId || undefined,
      };

      if (newTargetValue) {
        payload.target_value = parseInt(newTargetValue);
      }

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create habit');
      }

      const data = await response.json();
      setHabits([...habits, data.data]);
      
      // Reset form
      setNewName('');
      setNewDescription('');
      setNewFrequency('daily');
      setNewTargetValue('');
      setNewLifeAreaId('');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Error creating habit:', err);
      setError(err.message || 'Failed to create habit');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrackHabit = async (habitId: string, value?: number) => {
    try {
      const headers = {
        ...authHelpers.getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const payload: any = {
        habit_id: habitId,
      };

      if (value !== undefined) {
        payload.value = value;
      }

      const response = await fetch('/api/habits/track', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to track habit');
      }

      const data = await response.json();
      
      // Update local tracking state
      setHabitTracking(prev => ({
        ...prev,
        [habitId]: [...(prev[habitId] || []), data.data],
      }));
    } catch (err) {
      console.error('Error tracking habit:', err);
      alert('Failed to track habit');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) {
      return;
    }

    try {
      const headers = authHelpers.getAuthHeaders();
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      setHabits(habits.filter(habit => habit.id !== habitId));
      setHabitTracking(prev => {
        const newTracking = { ...prev };
        delete newTracking[habitId];
        return newTracking;
      });
    } catch (err) {
      console.error('Error deleting habit:', err);
      alert('Failed to delete habit');
    }
  };

  const getLifeAreaColor = (lifeAreaId?: string) => {
    if (!lifeAreaId) return '#6B7280';
    const lifeArea = lifeAreas.find(area => area.id === lifeAreaId);
    return lifeArea?.color || '#6B7280';
  };

  const getLifeAreaName = (lifeAreaId?: string) => {
    if (!lifeAreaId) return 'No Category';
    const lifeArea = lifeAreas.find(area => area.id === lifeAreaId);
    return lifeArea?.name || 'Unknown';
  };

  const getTodayTracking = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return (habitTracking[habitId] || []).filter(
      tracking => tracking.completed_at.startsWith(today)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
          <p className="mt-2 text-gray-600">
            Track your daily practices and build lasting positive habits
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Habit
        </Button>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Habit</CardTitle>
            <CardDescription>
              Define a new habit to track regularly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Morning meditation, Drink water, Exercise"
                  required
                  disabled={isCreating}
                />
                
                <Select
                  label="Frequency"
                  options={frequencyOptions}
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  disabled={isCreating}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Value (optional)"
                  type="number"
                  value={newTargetValue}
                  onChange={(e) => setNewTargetValue(e.target.value)}
                  placeholder="e.g., 8 (for 8 glasses of water)"
                  disabled={isCreating}
                />
                
                <Select
                  label="Life Area (optional)"
                  options={[
                    { value: '', label: 'No category' },
                    ...lifeAreas.map(area => ({ value: area.id, label: area.name }))
                  ]}
                  value={newLifeAreaId}
                  onChange={(e) => setNewLifeAreaId(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              
              <Textarea
                label="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your habit and why it's important to you..."
                disabled={isCreating}
                rows={3}
              />
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isCreating}
                  disabled={isCreating || !newName.trim()}
                >
                  Create Habit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first habit to start building positive routines.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => {
            const todayTracking = getTodayTracking(habit.id);
            const isCompletedToday = todayTracking.length > 0;
            const lifeAreaColor = getLifeAreaColor(habit.life_area_id);
            
            return (
              <Card key={habit.id} className={`hover:shadow-md transition-all ${isCompletedToday ? 'ring-2 ring-success-200 bg-success-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: lifeAreaColor }}
                        />
                        <CardTitle className="text-lg">{habit.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs ${
                          habit.frequency === 'daily' ? 'bg-green-100 text-green-800' :
                          habit.frequency === 'weekly' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {habit.frequency}
                        </span>
                        <span>{getLifeAreaName(habit.life_area_id)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Link href={`/habits/${habit.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                {habit.description && (
                  <CardDescription className="mt-2">{habit.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tracking Status */}
                  <div className="text-sm">
                    {isCompletedToday ? (
                      <div className="flex items-center space-x-2 text-success-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Completed today!</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Not completed today</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Track Button */}
                  <div className="pt-2">
                    {!isCompletedToday ? (
                      <Button
                        onClick={() => handleTrackHabit(habit.id, habit.target_value)}
                        className="w-full"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Complete
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        ✓ Completed Today
                      </Button>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Total completions: {(habitTracking[habit.id] || []).length}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Tips Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Habit Building Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Start Small</h4>
              <p className="text-gray-600">
                Begin with tiny habits that are easy to complete. Consistency matters more than intensity.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Stack Habits</h4>
              <p className="text-gray-600">
                Link new habits to existing routines. "After I brush my teeth, I will meditate for 2 minutes."
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Track Progress</h4>
              <p className="text-gray-600">
                Use this tracker to see your consistency patterns and celebrate your wins.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Be Patient</h4>
              <p className="text-gray-600">
                It takes time to form habits. Focus on consistency rather than perfection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}