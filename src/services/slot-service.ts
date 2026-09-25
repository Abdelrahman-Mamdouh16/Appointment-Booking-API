import { BookingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const findAvailableSlots = () => {
  return prisma.slot.findMany({
    where: {
      bookings: {
        none: {
          status: BookingStatus.active,
        },
      },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
  });
};