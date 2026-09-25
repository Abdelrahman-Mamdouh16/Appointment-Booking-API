import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

type SlotBookedPayload = {
  slotId: string;
  bookingId: string;
  available: false;
};

type SlotReleasedPayload = {
  slotId: string;
  bookingId: string;
  available: true;
};

let io: Server | undefined;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer);
  return io;
};

export const emitSlotBooked = (payload: SlotBookedPayload) => {
  io?.emit('slot.booked', payload);
};

export const emitSlotReleased = (payload: SlotReleasedPayload) => {
  io?.emit('slot.released', payload);
};

export const closeSocket = () => {
  io?.close();
  io = undefined;
};