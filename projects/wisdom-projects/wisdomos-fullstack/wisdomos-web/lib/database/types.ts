export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  mood_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  life_area_id?: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_value?: number;
  created_at: string;
  updated_at: string;
}

export interface HabitTracking {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  value?: number;
  notes?: string;
}