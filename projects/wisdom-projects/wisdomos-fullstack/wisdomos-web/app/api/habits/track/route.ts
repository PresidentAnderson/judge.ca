import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HabitTrackingModel, HabitModel } from '@/lib/database/models';
import { getUserFromHeaders } from '@/lib/middleware';

const trackHabitSchema = z.object({
  habit_id: z.string().min(1, 'Habit ID is required'),
  value: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = trackHabitSchema.parse(body);

    // Verify that the habit belongs to the user
    const habit = await HabitModel.findById(validatedData.habit_id);
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const trackingEntry = await HabitTrackingModel.create({
      habit_id: validatedData.habit_id,
      user_id: user.id,
      completed_at: new Date().toISOString(),
      value: validatedData.value,
      notes: validatedData.notes,
    });

    return NextResponse.json({ data: trackingEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error tracking habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habit_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    if (habitId) {
      // Verify that the habit belongs to the user
      const habit = await HabitModel.findById(habitId);
      if (!habit || habit.user_id !== user.id) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
      }

      const today = new Date().toISOString().split('T')[0];
      const trackingEntries = await HabitTrackingModel.findByHabitAndDate(habitId, today);
      return NextResponse.json({ data: trackingEntries });
    } else {
      // Get all tracking entries for the user
      const trackingEntries = await HabitTrackingModel.findByUserId(user.id, limit);
      return NextResponse.json({ data: trackingEntries });
    }
  } catch (error) {
    console.error('Error fetching habit tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}