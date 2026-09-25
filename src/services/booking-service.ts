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

const bookingSelect = {
  id: true,
  slotId: true,
  customerName: true,
  customerEmail: true,
  status: true,
} as const;

export const cancelBooking = async (bookingId: string) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: bookingSelect,
    });

    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 'The requested booking was not found.');
    }

    if (booking.status === BookingStatus.cancelled) {
      return booking;
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.cancelled },
      select: bookingSelect,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new AppError('BOOKING_NOT_FOUND', 'The requested booking was not found.');
    }

    throw error;
  }
};