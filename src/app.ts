import express from 'express';
import { bookingRoutes } from './routes/booking-routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { slotRoutes } from './routes/slot-routes.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use(slotRoutes);
app.use(bookingRoutes);

app.use(errorHandler);

export default app;