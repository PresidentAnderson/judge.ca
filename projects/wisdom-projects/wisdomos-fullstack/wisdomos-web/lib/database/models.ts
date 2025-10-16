import { neonApi } from './neon-api';
import type { User, JournalEntry, LifeArea, Habit, HabitTracking } from './types';

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await neonApi.insert<User>('users', {
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return result.data[0];
  }

  static async findById(id: string): Promise<User | null> {
    return neonApi.findById<User>('users', id);
  }

  static async findByEmail(email: string): Promise<User | null> {
    const users = await neonApi.findMany<User>('users', { email }, { limit: 1 });
    return users[0] || null;
  }

  static async update(id: string, userData: Partial<User>): Promise<User> {
    const result = await neonApi.update<User>('users', {
      ...userData,
      updated_at: new Date().toISOString(),
    }, { id });
    return result.data[0];
  }
}

export class JournalModel {
  static async create(entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    const result = await neonApi.insert<JournalEntry>('journal_entries', {
      ...entryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return result.data[0];
  }

  static async findById(id: string): Promise<JournalEntry | null> {
    return neonApi.findById<JournalEntry>('journal_entries', id);
  }

  static async findByUserId(userId: string, limit = 50): Promise<JournalEntry[]> {
    return neonApi.findMany<JournalEntry>('journal_entries', 
      { user_id: userId }, 
      { limit, order: 'created_at desc' }
    );
  }

  static async update(id: string, entryData: Partial<JournalEntry>): Promise<JournalEntry> {
    const result = await neonApi.update<JournalEntry>('journal_entries', {
      ...entryData,
      updated_at: new Date().toISOString(),
    }, { id });
    return result.data[0];
  }

  static async delete(id: string): Promise<void> {
    await neonApi.delete('journal_entries', { id });
  }
}

export class LifeAreaModel {
  static async create(areaData: Omit<LifeArea, 'id' | 'created_at' | 'updated_at'>): Promise<LifeArea> {
    const result = await neonApi.insert<LifeArea>('life_areas', {
      ...areaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return result.data[0];
  }

  static async findById(id: string): Promise<LifeArea | null> {
    return neonApi.findById<LifeArea>('life_areas', id);
  }

  static async findByUserId(userId: string): Promise<LifeArea[]> {
    return neonApi.findMany<LifeArea>('life_areas', 
      { user_id: userId }, 
      { order: 'name asc' }
    );
  }

  static async update(id: string, areaData: Partial<LifeArea>): Promise<LifeArea> {
    const result = await neonApi.update<LifeArea>('life_areas', {
      ...areaData,
      updated_at: new Date().toISOString(),
    }, { id });
    return result.data[0];
  }

  static async delete(id: string): Promise<void> {
    await neonApi.delete('life_areas', { id });
  }
}

export class HabitModel {
  static async create(habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    const result = await neonApi.insert<Habit>('habits', {
      ...habitData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return result.data[0];
  }

  static async findById(id: string): Promise<Habit | null> {
    return neonApi.findById<Habit>('habits', id);
  }

  static async findByUserId(userId: string): Promise<Habit[]> {
    return neonApi.findMany<Habit>('habits', 
      { user_id: userId }, 
      { order: 'name asc' }
    );
  }

  static async findByLifeArea(lifeAreaId: string): Promise<Habit[]> {
    return neonApi.findMany<Habit>('habits', 
      { life_area_id: lifeAreaId }, 
      { order: 'name asc' }
    );
  }

  static async update(id: string, habitData: Partial<Habit>): Promise<Habit> {
    const result = await neonApi.update<Habit>('habits', {
      ...habitData,
      updated_at: new Date().toISOString(),
    }, { id });
    return result.data[0];
  }

  static async delete(id: string): Promise<void> {
    await neonApi.delete('habits', { id });
  }
}

export class HabitTrackingModel {
  static async create(trackingData: Omit<HabitTracking, 'id'>): Promise<HabitTracking> {
    const result = await neonApi.insert<HabitTracking>('habit_tracking', trackingData);
    return result.data[0];
  }

  static async findByHabitAndDate(habitId: string, date: string): Promise<HabitTracking[]> {
    return neonApi.findMany<HabitTracking>('habit_tracking', {
      habit_id: habitId,
      completed_at: date,
    });
  }

  static async findByUserId(userId: string, limit = 100): Promise<HabitTracking[]> {
    return neonApi.findMany<HabitTracking>('habit_tracking', 
      { user_id: userId }, 
      { limit, order: 'completed_at desc' }
    );
  }

  static async delete(id: string): Promise<void> {
    await neonApi.delete('habit_tracking', { id });
  }
}