import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be set before preparing the test database.');
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be different from DATABASE_URL.');
}

process.env.DATABASE_URL = testDatabaseUrl;

const main = async () => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  } finally {
    await prisma.$disconnect();
  }

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  execFileSync(pnpmCommand, ['exec', 'prisma', 'migrate', 'deploy'], {
    env: process.env,
    stdio: 'inherit',
  });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});