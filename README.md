# Appointment Booking API

## Project overview

This project is a backend Appointment Booking API. It exposes available appointment slots, creates active bookings, cancels bookings without deleting their historical rows, and broadcasts booking state changes through Socket.IO.

The API has no authentication, authorization, payments, frontend, queues, Redis, or caching. The HTTP API is documented with OpenAPI and Swagger UI.

## Technology stack

- Node.js 20+
- TypeScript
- Express 5
- PostgreSQL
- Prisma ORM 6.16.2
- Socket.IO 4.8.3
- Swagger UI Express 5.0.1
- Joi validation
- Vitest 5.0.1
- Supertest 7.3.0
- pnpm

## Requirements and prerequisites

- Node.js 20 or newer
- pnpm 12 or newer
- PostgreSQL 14 or newer, running locally or remotely
- A PostgreSQL database for development
- A separate PostgreSQL database for integration tests

No Docker configuration is included. The test suite requires a real PostgreSQL database and does not use SQLite or mocked Prisma.

## Installation

```bash
pnpm install
```

`pnpm install` generates the Prisma Client through the `postinstall` script. It can also be generated explicitly:

```bash
pnpm db:generate
```

## Environment variables

Copy [.env.example](.env.example) to `.env` and replace the placeholders:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

`DATABASE_URL` must point to the normal development PostgreSQL database. Do not commit `.env` or real credentials.

For tests, copy [.env.test.example](.env.test.example) to `.env.test`:

```env
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/appointment_booking_test?schema=public
```

`TEST_DATABASE_URL` must point to a dedicated test database and must not be the same database as `DATABASE_URL`. The test setup refuses to continue if the two values are equal.

## PostgreSQL setup

Create two empty PostgreSQL databases, one for development and one for tests. For example, from a PostgreSQL shell with appropriate permissions:

```sql
CREATE DATABASE appointment_booking;
CREATE DATABASE appointment_booking_test;
```

Put the corresponding connection strings in `.env` and `.env.test`. Prisma migrations create the `Slot`, `Booking`, and `BookingStatus` database objects.

The test setup drops and recreates the `public` schema, so it must only be used with the dedicated test database.

## Prisma commands

Generate the client:

```bash
pnpm db:generate
```

Apply migrations in a deployed environment:

```bash
pnpm db:migrate:deploy
```

Create/apply a development migration:

```bash
pnpm db:migrate
```

Seed the development database with deterministic appointment slots:

```bash
pnpm db:seed
```

Run the complete development database setup:

```bash
pnpm db:setup
```

The seed uses fixed UUIDs and UTC timestamps and is safe to repeat for the seeded slots through upserts.

## Running the server

Start the development server with watch mode:

```bash
pnpm dev
```

Build and start the production-style server:

```bash
pnpm build
pnpm start
```

The default HTTP port is `3000`, configurable with `PORT`.

## API URLs

The default base URL is `http://localhost:3000`.

- `GET /slots`
- `POST /bookings`
- `DELETE /bookings/:bookingId`
- `GET /docs`
- `GET /openapi.json`

Authentication is not required.

## API examples

### List available slots

```bash
curl http://localhost:3000/slots
```

Example response:

```json
{
	"slots": [
		{
			"id": "11111111-1111-4111-8111-111111111111",
			"startsAt": "2026-10-05T09:00:00.000Z",
			"endsAt": "2026-10-05T09:30:00.000Z"
		}
	]
}
```

Only slots without an active booking are returned. Cancelled bookings do not make a slot unavailable. Slots are sorted by `startsAt` ascending and then `id` ascending.

### Create a booking

```bash
curl -X POST http://localhost:3000/bookings \
	-H "Content-Type: application/json" \
	-d '{
		"slotId": "11111111-1111-4111-8111-111111111111",
		"customerName": "Alex Morgan",
		"customerEmail": "alex@example.com"
	}'
```

`customerName` and `customerEmail` are trimmed before validation and persistence. The trimmed name must be non-empty and the trimmed email must be valid. The booking is always created with `status: "active"`.

Example response:

```json
{
	"booking": {
		"id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		"slotId": "11111111-1111-4111-8111-111111111111",
		"customerName": "Alex Morgan",
		"customerEmail": "alex@example.com",
		"status": "active"
	}
}
```

### Cancel a booking

```bash
curl -X DELETE http://localhost:3000/bookings/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
```

Example response:

```json
{
	"booking": {
		"id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		"slotId": "11111111-1111-4111-8111-111111111111",
		"customerName": "Alex Morgan",
		"customerEmail": "alex@example.com",
		"status": "cancelled"
	}
}
```

Cancellation changes an active booking to `cancelled`; it does not delete the row. Repeating cancellation for an already-cancelled booking returns HTTP 200 with the same booking and makes no change.

## Error behavior

Errors use this shape:

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "customerEmail must be a valid email address."
	}
}
```

Required error codes and statuses:

| Endpoint | HTTP status | Code | Meaning |
| --- | ---: | --- | --- |
| `POST /bookings` | 400 | `VALIDATION_ERROR` | Invalid JSON, UUID, name, email, or missing field |
| `POST /bookings` | 404 | `SLOT_NOT_FOUND` | The slot UUID does not exist |
| `POST /bookings` | 409 | `SLOT_UNAVAILABLE` | The slot already has an active booking |
| `POST /bookings` | 500 | `INTERNAL_ERROR` | Unexpected server/database failure |
| `DELETE /bookings/:bookingId` | 400 | `VALIDATION_ERROR` | Invalid booking UUID |
| `DELETE /bookings/:bookingId` | 404 | `BOOKING_NOT_FOUND` | The booking UUID does not exist |
| `DELETE /bookings/:bookingId` | 500 | `INTERNAL_ERROR` | Unexpected server/database failure |

Stack traces and Prisma/database details are not exposed to API clients.

## Concurrency protection

The migration creates this PostgreSQL partial unique index:

```sql
CREATE UNIQUE INDEX "Booking_slotId_active_key"
ON "Booking"("slotId")
WHERE "status" = 'active';
```

A check-then-insert implementation is unsafe because two concurrent requests can both observe an available slot before either insert commits. Both requests could then attempt to insert an active booking.

The API performs the booking insert directly. PostgreSQL is the authority that allows only one active booking for a slot. Prisma reports the losing insert as error `P2002`; the service maps it to HTTP 409 `SLOT_UNAVAILABLE` without exposing database details. Therefore two truly concurrent valid requests for one available slot result in one HTTP 201 and one HTTP 409, with exactly one active booking persisted.

## Database design

`Slot` stores an appointment window with a UUID primary key, UTC PostgreSQL timestamps, and a one-to-many relation to `Booking`.

`Booking` stores the customer data, slot foreign key, status (`active` or `cancelled`), and timestamps. A slot may have multiple historical bookings, but the partial unique index allows at most one active booking at a time. Cancelled rows are retained so booking history and cancellation IDs remain accessible. A cancelled booking does not prevent a new active booking for the same slot.

## Socket.IO

Socket.IO uses the same HTTP server as Express:

- Namespace: `/`
- Path: `/socket.io`
- Authentication: none
- Rooms: none
- Client-originated application events: none required

### `slot.booked`

Emitted exactly once after a booking is successfully committed:

```json
{
	"slotId": "11111111-1111-4111-8111-111111111111",
	"bookingId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
	"available": false
}
```

### `slot.released`

Emitted exactly once after an active booking is successfully changed to cancelled:

```json
{
	"slotId": "11111111-1111-4111-8111-111111111111",
	"bookingId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
	"available": true
}
```

Rejected booking requests do not emit events. Repeated cancellation of an already-cancelled booking does not emit an event. Socket.IO payloads intentionally contain no customer name or email.

## Socket.IO testing without a frontend

Start the API first:

```bash
pnpm dev
```

In another terminal, run the TypeScript Socket.IO client example:

```bash
pnpm socket:client
```

The client connects to the default namespace and logs `slot.booked` and `slot.released`. Make a booking request with the curl command above, then cancel that booking with the DELETE command to observe the events. The client does not emit application events, use rooms, or authenticate.

## Automated tests

The integration suite uses:

- A real PostgreSQL test database from `TEST_DATABASE_URL`.
- Prisma Client for database setup and assertions.
- Supertest against the Express app.
- Vitest.
- No Prisma mocks and no SQLite.

Create `.env.test` from [.env.test.example](.env.test.example), using a database separate from development. Prepare it with:

```bash
pnpm test:db:setup
```

This command drops and recreates the `public` schema in the configured test database, then applies the committed Prisma migrations. It must never be pointed at the normal development database.

Run the suite:

```bash
pnpm test
```

Run watch mode:

```bash
pnpm test:watch
```

Each test cleans the `Booking` and `Slot` tables and creates a known fixed-UUID available slot before running. The suite covers successful booking, GET availability, real concurrent booking requests with different customer data, cancellation and rebooking, historical cancelled rows, repeated cancellation, invalid UUIDs, nonexistent slots, and nonexistent bookings. The concurrency test sends both requests through `Promise.all` and queries PostgreSQL through Prisma to assert exactly one active booking.

## Important architectural decisions

- `app.ts` configures Express and is exported for Supertest; `server.ts` owns the HTTP server lifecycle.
- Socket.IO is attached to the same `http.Server` instance as Express.
- Prisma services own database operations; controllers translate requests into service calls.
- PostgreSQL enforces the active-booking invariant; application checks are not used as concurrency protection.
- Cancelled bookings are state transitions, not deletes, so history remains queryable.
- OpenAPI is defined once and served as both JSON and Swagger UI.

## Possible future improvements

- Add authentication and authorization if the product requires user accounts.
- Add rate limiting, structured logging, and request correlation IDs.
- Add pagination or date filtering if the slot catalogue grows.
- Add graceful database shutdown and health/readiness probes.
- Add CI execution against a provisioned PostgreSQL service.

## Actual development time

> Developer: fill in the actual time spent on this assessment: **[TODO]**

## Incomplete requirements

No requested application feature is intentionally incomplete. Full integration test execution is environment-dependent and requires a configured, reachable PostgreSQL test database through `TEST_DATABASE_URL`.

## AI disclosure

GitHub Copilot was used as an AI programming assistant during implementation. AI-generated suggestions were reviewed against the assessment requirements and the existing code, then adjusted to match the project architecture and actual runtime behavior.

The implementation was manually verified with typechecking, linting, builds, HTTP requests to the API and documentation routes, and a real Socket.IO client connection. The integration tests are written for a real PostgreSQL database and are intended to be run after configuring the dedicated test database. The developer understands the implementation, including the Prisma constraints, concurrency behavior, validation, error mapping, OpenAPI contract, and Socket.IO event lifecycle, and can explain or modify it.