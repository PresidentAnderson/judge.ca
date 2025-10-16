'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button, LoadingSpinner, Input } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

interface LifeArea {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export default function LifeAreasPage() {
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  useEffect(() => {
    const loadLifeAreas = async () => {
      try {
        setIsLoading(true);
        const headers = authHelpers.getAuthHeaders();
        const response = await fetch('/api/life-areas', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch life areas');
        }

        const data = await response.json();
        setLifeAreas(data.data || []);
      } catch (err) {
        console.error('Error loading life areas:', err);
        setError('Failed to load life areas');
      } finally {
        setIsLoading(false);
      }
    };

    loadLifeAreas();
  }, []);

  const handleCreateLifeArea = async (e: React.FormEvent) => {
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

      const payload = {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        color: newColor,
      };

      const response = await fetch('/api/life-areas', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create life area');
      }

      const data = await response.json();
      setLifeAreas([...lifeAreas, data.data]);
      
      // Reset form
      setNewName('');
      setNewDescription('');
      setNewColor('#3B82F6');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Error creating life area:', err);
      setError(err.message || 'Failed to create life area');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLifeArea = async (lifeAreaId: string) => {
    if (!confirm('Are you sure you want to delete this life area?')) {
      return;
    }

    try {
      const headers = authHelpers.getAuthHeaders();
      const response = await fetch(`/api/life-areas/${lifeAreaId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete life area');
      }

      setLifeAreas(lifeAreas.filter(area => area.id !== lifeAreaId));
    } catch (err) {
      console.error('Error deleting life area:', err);
      alert('Failed to delete life area');
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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Life Areas</h1>
          <p className="mt-2 text-gray-600">
            Organize your goals and habits by different aspects of your life
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Life Area
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
            <CardTitle>Create New Life Area</CardTitle>
            <CardDescription>
              Define a new area of your life to organize your habits and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLifeArea} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Health & Fitness, Career, Relationships"
                    required
                    disabled={isCreating}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      className="input min-h-20"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Describe what this life area represents..."
                      disabled={isCreating}
                      rows={3}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 ${
                          newColor === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewColor(color)}
                        disabled={isCreating}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Selected: {newColor}</p>
                </div>
              </div>
              
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
                  Create Life Area
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Life Areas Grid */}
      {lifeAreas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No life areas yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first life area to start organizing your habits and goals.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Life Area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lifeAreas.map((area) => (
            <Card key={area.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: area.color || '#3B82F6' }}
                    />
                    <CardTitle className="text-lg truncate">{area.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Link href={`/life-areas/${area.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLifeArea(area.id)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                {area.description && (
                  <CardDescription className="mt-2">{area.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  Created {new Date(area.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/habits?life_area=${area.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Related Habits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">About Life Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What are Life Areas?</h4>
              <p className="text-gray-600">
                Life Areas help you organize different aspects of your life like health, career, 
                relationships, and personal development. This makes it easier to maintain balance 
                and track progress across all areas.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How to Use Them</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Create areas that matter most to you</li>
                <li>• Assign habits to specific life areas</li>
                <li>• Track progress and maintain balance</li>
                <li>• Use colors to visually organize</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}