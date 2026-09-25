import { Router } from 'express';
import { getAvailableSlots } from '../controllers/slot-controller.js';
import { rejectRequestInput } from '../middlewares/validate.js';

export const slotRoutes = Router();

slotRoutes.get('/slots', rejectRequestInput, getAvailableSlots);