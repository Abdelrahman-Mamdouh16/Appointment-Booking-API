import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slots = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    startsAt: new Date('2026-10-05T09:00:00.000Z'),
    endsAt: new Date('2026-10-05T09:30:00.000Z'),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    startsAt: new Date('2026-10-05T10:00:00.000Z'),
    endsAt: new Date('2026-10-05T10:30:00.000Z'),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    startsAt: new Date('2026-10-06T14:00:00.000Z'),
    endsAt: new Date('2026-10-06T14:45:00.000Z'),
  },
];

async function main() {
  for (const slot of slots) {
    await prisma.slot.upsert({
      where: { id: slot.id },
      update: {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      },
      create: slot,
    });
  }

  console.log(`Seeded ${slots.length} appointment slots`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });