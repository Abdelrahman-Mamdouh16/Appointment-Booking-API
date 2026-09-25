import { Router } from 'express';
import { deleteBooking, postBooking } from '../controllers/booking-controller.js';
import { validate } from '../middlewares/validate.js';
import { bookingIdParamsSchema, createBookingBodySchema } from '../validators/booking.js';

export const bookingRoutes = Router();

bookingRoutes.post('/bookings', validate(createBookingBodySchema, 'body'), postBooking);
bookingRoutes.delete(
	'/bookings/:bookingId',
	validate(bookingIdParamsSchema, 'params'),
	deleteBooking,
);