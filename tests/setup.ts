import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be set before running integration tests.');
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be different from DATABASE_URL.');
}

process.env.DATABASE_URL = testDatabaseUrl;