import { Router } from 'express';
import { postBooking } from '../controllers/booking-controller.js';
import { validate } from '../middlewares/validate.js';
import { createBookingBodySchema } from '../validators/booking.js';

export const bookingRoutes = Router();

bookingRoutes.post('/bookings', validate(createBookingBodySchema, 'body'), postBooking);