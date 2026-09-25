# Appointment Booking API

## Socket.IO client example

Start the API with `pnpm dev` or `pnpm start`, then run the example client in another terminal:

```bash
pnpm socket:client
```

The client connects to the default namespace using the default `/socket.io` path and logs `slot.booked` and `slot.released` events. It does not authenticate, join rooms, or emit application events.

## PostgreSQL integration tests

Create a local `.env.test` from [.env.test.example](.env.test.example) and set `TEST_DATABASE_URL` to a dedicated PostgreSQL test database. It must not be the same database as `DATABASE_URL`.

Prepare the test database and apply migrations:

```bash
pnpm test:db:setup
```

Run the real PostgreSQL integration tests:

```bash
pnpm test
```

Run them in watch mode:

```bash
pnpm test:watch
```

The suite resets its tables between tests and uses Prisma directly for database assertions. It does not mock Prisma or use SQLite.