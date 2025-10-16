import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LifeAreaModel } from '@/lib/database/models';
import { getUserFromHeaders } from '@/lib/middleware';

const updateLifeAreaSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lifeArea = await LifeAreaModel.findById(params.id);
    if (!lifeArea) {
      return NextResponse.json({ error: 'Life area not found' }, { status: 404 });
    }

    // Ensure the life area belongs to the authenticated user
    if (lifeArea.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: lifeArea });
  } catch (error) {
    console.error('Error fetching life area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check if life area exists and belongs to user
    const existingLifeArea = await LifeAreaModel.findById(params.id);
    if (!existingLifeArea) {
      return NextResponse.json({ error: 'Life area not found' }, { status: 404 });
    }

    if (existingLifeArea.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateLifeAreaSchema.parse(body);

    const updatedLifeArea = await LifeAreaModel.update(params.id, validatedData);
    return NextResponse.json({ data: updatedLifeArea });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating life area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check if life area exists and belongs to user
    const existingLifeArea = await LifeAreaModel.findById(params.id);
    if (!existingLifeArea) {
      return NextResponse.json({ error: 'Life area not found' }, { status: 404 });
    }

    if (existingLifeArea.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await LifeAreaModel.delete(params.id);
    return NextResponse.json({ message: 'Life area deleted successfully' });
  } catch (error) {
    console.error('Error deleting life area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}