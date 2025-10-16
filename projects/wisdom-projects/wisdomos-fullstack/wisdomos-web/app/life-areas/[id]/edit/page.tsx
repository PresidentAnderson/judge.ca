'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, Button, Input, LoadingSpinner } from '@/components/ui';
import { authHelpers } from '@/lib/auth';

interface LifeArea {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export default function EditLifeAreaPage({ params }: { params: { id: string } }) {
  const [lifeArea, setLifeArea] = useState<LifeArea | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    const loadLifeArea = async () => {
      try {
        setIsLoading(true);
        const headers = authHelpers.getAuthHeaders();
        const response = await fetch(`/api/life-areas/${params.id}`, { headers });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Life area not found');
          } else {
            throw new Error('Failed to fetch life area');
          }
          return;
        }

        const data = await response.json();
        const areaData = data.data;
        
        setLifeArea(areaData);
        setName(areaData.name || '');
        setDescription(areaData.description || '');
        setColor(areaData.color || '#3B82F6');
      } catch (err) {
        console.error('Error loading life area:', err);
        setError('Failed to load life area');
      } finally {
        setIsLoading(false);
      }
    };

    loadLifeArea();
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

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      };

      const response = await fetch(`/api/life-areas/${params.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update life area');
      }

      router.push('/life-areas');
    } catch (err: any) {
      console.error('Error updating life area:', err);
      setError(err.message || 'Failed to update life area');
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

  if (error && !lifeArea) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/life-areas">
            <Button variant="outline">← Back to Life Areas</Button>
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
          <Link href="/life-areas">
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              ← Back to Life Areas
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Life Area</h1>
        <p className="mt-2 text-gray-600">
          Update your life area details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Life Area</CardTitle>
          {lifeArea && (
            <p className="text-sm text-gray-500">
              Created on {new Date(lifeArea.created_at).toLocaleDateString('en-US', {
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
              placeholder="e.g., Health & Fitness, Career, Relationships"
              required
              disabled={isSaving}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                className="input min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this life area represents..."
                disabled={isSaving}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    className={`w-12 h-12 rounded-xl border-2 transition-all hover:scale-105 ${
                      color === colorOption 
                        ? 'border-gray-900 ring-2 ring-gray-300' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => setColor(colorOption)}
                    disabled={isSaving}
                  />
                ))}
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-700">Selected color: {color}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link href="/life-areas">
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
                Update Life Area
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div>
              <h4 className="font-medium text-gray-900">{name || 'Life Area Name'}</h4>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}