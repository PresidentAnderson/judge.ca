import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HabitModel, HabitTrackingModel } from '@/lib/database/models';
import { getUserFromHeaders } from '@/lib/middleware';

const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_value: z.number().optional(),
  life_area_id: z.string().optional(),
});

const updateHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  target_value: z.number().optional(),
  life_area_id: z.string().optional(),
});

const trackHabitSchema = z.object({
  habit_id: z.string().min(1, 'Habit ID is required'),
  value: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habits = await HabitModel.findByUserId(user.id);
    return NextResponse.json({ data: habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createHabitSchema.parse(body);

    const newHabit = await HabitModel.create({
      ...validatedData,
      user_id: user.id,
    });

    return NextResponse.json({ data: newHabit }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}