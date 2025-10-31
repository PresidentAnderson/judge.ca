import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../../backend/utils/database';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['user', 'attorney']),
  barNumber: z.string().optional(),
  phone: z.string().optional()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db('users').where({ email: validatedData.email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const [userId] = await db('users').insert({
      email: validatedData.email,
      password: hashedPassword,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      role: validatedData.role,
      bar_number: validatedData.barNumber,
      phone: validatedData.phone,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: validatedData.email, role: validatedData.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}