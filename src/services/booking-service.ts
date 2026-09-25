import { BookingStatus, Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';

export type CreateBookingInput = {
  slotId: string;
  customerName: string;
  customerEmail: string;
};

export const createBooking = async (input: CreateBookingInput) => {
  try {
    return await prisma.booking.create({
      data: {
        slotId: input.slotId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        status: BookingStatus.active,
      },
      select: {
        id: true,
        slotId: true,
        customerName: true,
        customerEmail: true,
        status: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new AppError('SLOT_UNAVAILABLE', 'This slot already has an active booking.');
      }

      if (error.code === 'P2003') {
        throw new AppError('SLOT_NOT_FOUND', 'The requested slot was not found.');
      }
    }

    throw error;
  }
};