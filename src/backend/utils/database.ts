import knex from 'knex';
import knexConfig from '../../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

export const db = knex(config);

export const checkConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};