import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LifeAreaModel } from '@/lib/database/models';
import { getUserFromHeaders } from '@/lib/middleware';

const createLifeAreaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateLifeAreaSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lifeAreas = await LifeAreaModel.findByUserId(user.id);
    return NextResponse.json({ data: lifeAreas });
  } catch (error) {
    console.error('Error fetching life areas:', error);
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
    const validatedData = createLifeAreaSchema.parse(body);

    const newLifeArea = await LifeAreaModel.create({
      ...validatedData,
      user_id: user.id,
    });

    return NextResponse.json({ data: newLifeArea }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating life area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}