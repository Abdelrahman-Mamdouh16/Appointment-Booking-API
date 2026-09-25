import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { cancelBooking, createBooking } from '../services/booking-service.js';

export const postBooking: RequestHandler = async (request, response, next) => {
  try {
    const booking = await createBooking(request.body);
    response.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking: RequestHandler = async (request, response, next) => {
  try {
    const { bookingId } = request.params;

    if (typeof bookingId !== 'string') {
      next(new AppError('VALIDATION_ERROR', 'bookingId must be a valid UUID.'));
      return;
    }

    const booking = await cancelBooking(bookingId);
    response.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};