import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const seededSlotId = '11111111-1111-4111-8111-111111111111';

const createSeededAvailableSlot = async () => {
  return prisma.slot.create({
    data: {
      id: seededSlotId,
      startsAt: new Date('2026-10-05T09:00:00.000Z'),
      endsAt: new Date('2026-10-05T09:30:00.000Z'),
    },
  });
};

const bookingPayload = (customerName: string, customerEmail: string) => ({
  slotId: seededSlotId,
  customerName,
  customerEmail,
});

describe('booking API integration', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.slot.deleteMany();
    await createSeededAvailableSlot();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a booking and removes the slot from available slots', async () => {
    const bookingResponse = await request(app)
      .post('/bookings')
      .send(bookingPayload('Alex Morgan', 'alex@example.com'));

    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.booking.status).toBe('active');

    const slotsResponse = await request(app).get('/slots');

    expect(slotsResponse.status).toBe(200);
    expect(slotsResponse.body.slots).toEqual([]);
  });

  it('allows exactly one concurrent booking for the same slot', async () => {
    const responses = await Promise.all([
      request(app)
        .post('/bookings')
        .send(bookingPayload('Alex Morgan', 'alex@example.com')),
      request(app)
        .post('/bookings')
        .send(bookingPayload('Jordan Lee', 'jordan@example.com')),
    ]);

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(1);

    const activeBookings = await prisma.booking.findMany({
      where: { slotId: seededSlotId, status: 'active' },
    });

    expect(activeBookings).toHaveLength(1);
  });

  it('cancels a booking, preserves its history, and allows rebooking', async () => {
    const originalResponse = await request(app)
      .post('/bookings')
      .send(bookingPayload('Alex Morgan', 'alex@example.com'));
    const originalBookingId = originalResponse.body.booking.id as string;

    const cancellationResponse = await request(app).delete(`/bookings/${originalBookingId}`);

    expect(cancellationResponse.status).toBe(200);
    expect(cancellationResponse.body.booking.status).toBe('cancelled');

    const slotsResponse = await request(app).get('/slots');
    expect(slotsResponse.body.slots.map((slot: { id: string }) => slot.id)).toContain(seededSlotId);

    const replacementResponse = await request(app)
      .post('/bookings')
      .send(bookingPayload('Jordan Lee', 'jordan@example.com'));

    expect(replacementResponse.status).toBe(201);

    const oldBooking = await prisma.booking.findUnique({ where: { id: originalBookingId } });
    const activeBookings = await prisma.booking.findMany({
      where: { slotId: seededSlotId, status: 'active' },
    });

    expect(oldBooking?.status).toBe('cancelled');
    expect(activeBookings).toHaveLength(1);
    expect(activeBookings[0]?.id).toBe(replacementResponse.body.booking.id);
  });

  it('returns validation errors for invalid UUIDs', async () => {
    const response = await request(app).delete('/bookings/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns SLOT_NOT_FOUND for a valid UUID with no slot', async () => {
    const response = await request(app)
      .post('/bookings')
      .send({
        slotId: '99999999-9999-4999-8999-999999999999',
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SLOT_NOT_FOUND');
  });

  it('returns BOOKING_NOT_FOUND for a valid UUID with no booking', async () => {
    const response = await request(app).delete(' /bookings/99999999-9999-4999-8999-999999999999'.trim());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('repeated cancellation returns the same cancelled booking', async () => {
    const bookingResponse = await request(app)
      .post('/bookings')
      .send(bookingPayload('Alex Morgan', 'alex@example.com'));
    const bookingId = bookingResponse.body.booking.id as string;

    const firstCancellation = await request(app).delete(`/bookings/${bookingId}`);
    const secondCancellation = await request(app).delete(`/bookings/${bookingId}`);

    expect(firstCancellation.status).toBe(200);
    expect(secondCancellation.status).toBe(200);
    expect(secondCancellation.body.booking).toEqual(firstCancellation.body.booking);
  });
});