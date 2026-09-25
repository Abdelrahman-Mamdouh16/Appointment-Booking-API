import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { closeSocket, initializeSocket } from './sockets/socket-server.js';

const server = createServer(app);
initializeSocket(server);

server.listen(env.port, () => {
  console.log(`Appointment Booking API listening on port ${env.port}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  closeSocket();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));