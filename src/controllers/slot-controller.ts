import type { RequestHandler } from 'express';
import { findAvailableSlots } from '../services/slot-service.js';

export const getAvailableSlots: RequestHandler = async (_request, response, next) => {
  try {
    const slots = await findAvailableSlots();
    response.status(200).json({ slots });
  } catch (error) {
    next(error);
  }
};