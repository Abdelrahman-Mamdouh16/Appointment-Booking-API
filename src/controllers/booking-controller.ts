import type { RequestHandler } from 'express';
import { createBooking } from '../services/booking-service.js';

export const postBooking: RequestHandler = async (request, response, next) => {
  try {
    const booking = await createBooking(request.body);
    response.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};