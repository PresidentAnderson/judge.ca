import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JournalModel } from '@/lib/database/models';
import { getUserFromHeaders } from '@/lib/middleware';

const createJournalEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  mood_rating: z.number().min(1).max(10).optional(),
});

const updateJournalEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required').optional(),
  mood_rating: z.number().min(1).max(10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const journalEntries = await JournalModel.findByUserId(user.id, limit);
    return NextResponse.json({ data: journalEntries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
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
    const validatedData = createJournalEntrySchema.parse(body);

    const newEntry = await JournalModel.create({
      ...validatedData,
      user_id: user.id,
    });

    return NextResponse.json({ data: newEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}