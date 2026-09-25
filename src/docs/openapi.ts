export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Appointment Booking API',
    version: '1.0.0',
    description:
      'Appointment slot and booking operations. Authentication is not required. Date-time values are UTC ISO 8601 strings.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    {
      name: 'Slots',
      description: 'Available appointment slots',
    },
    {
      name: 'Bookings',
      description: 'Create and cancel appointment bookings',
    },
  ],
  paths: {
    '/slots': {
      get: {
        tags: ['Slots'],
        summary: 'List available slots',
        description:
          'Returns slots with no active booking. Cancelled bookings do not make a slot unavailable. This operation accepts no query parameters and no request body.',
        responses: {
          '200': {
            description: 'Available slots, sorted by startsAt ascending and then id ascending.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SlotsResponse' },
                examples: {
                  availableSlots: {
                    value: {
                      slots: [
                        {
                          id: '11111111-1111-4111-8111-111111111111',
                          startsAt: '2026-10-05T09:00:00.000Z',
                          endsAt: '2026-10-05T09:30:00.000Z',
                        },
                      ],
                    },
                  },
                  noAvailableSlots: {
                    value: { slots: [] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create an active booking',
        description:
          'Creates an active booking for an available slot. customerName and customerEmail are trimmed before validation and persistence. A concurrent booking for the same slot returns SLOT_UNAVAILABLE.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBookingRequest' },
              example: {
                slotId: '11111111-1111-4111-8111-111111111111',
                customerName: 'Alex Morgan',
                customerEmail: 'alex@example.com',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Booking created with active status.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingResponse' },
                example: {
                  booking: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    slotId: '11111111-1111-4111-8111-111111111111',
                    customerName: 'Alex Morgan',
                    customerEmail: 'alex@example.com',
                    status: 'active',
                  },
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '404': {
            $ref: '#/components/responses/SlotNotFound',
          },
          '409': {
            $ref: '#/components/responses/SlotUnavailable',
          },
          '500': {
            $ref: '#/components/responses/InternalError',
          },
        },
      },
    },
    '/bookings/{bookingId}': {
      delete: {
        tags: ['Bookings'],
        summary: 'Cancel a booking',
        description:
          'Changes an active booking to cancelled without deleting its row. Cancelling an already-cancelled booking is idempotent: it returns HTTP 200 with the same booking and makes no change. No request body is required.',
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            description: 'Booking UUID.',
            schema: {
              type: 'string',
              format: 'uuid',
            },
            example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          },
        ],
        responses: {
          '200': {
            description: 'Booking cancelled or already cancelled.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingResponse' },
                example: {
                  booking: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    slotId: '11111111-1111-4111-8111-111111111111',
                    customerName: 'Alex Morgan',
                    customerEmail: 'alex@example.com',
                    status: 'cancelled',
                  },
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '404': {
            $ref: '#/components/responses/BookingNotFound',
          },
          '500': {
            $ref: '#/components/responses/InternalError',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Slot: {
        type: 'object',
        required: ['id', 'startsAt', 'endsAt'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '11111111-1111-4111-8111-111111111111',
          },
          startsAt: {
            type: 'string',
            format: 'date-time',
            description: 'UTC ISO 8601 timestamp.',
            example: '2026-10-05T09:00:00.000Z',
          },
          endsAt: {
            type: 'string',
            format: 'date-time',
            description: 'UTC ISO 8601 timestamp.',
            example: '2026-10-05T09:30:00.000Z',
          },
        },
      },
      SlotsResponse: {
        type: 'object',
        required: ['slots'],
        properties: {
          slots: {
            type: 'array',
            items: { $ref: '#/components/schemas/Slot' },
          },
        },
      },
      CreateBookingRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['slotId', 'customerName', 'customerEmail'],
        properties: {
          slotId: {
            type: 'string',
            format: 'uuid',
            description: 'UUID of an existing available slot.',
          },
          customerName: {
            type: 'string',
            minLength: 1,
            description: 'Required non-empty name. Leading and trailing whitespace is trimmed before validation and persistence.',
            example: 'Alex Morgan',
          },
          customerEmail: {
            type: 'string',
            format: 'email',
            description: 'Required valid email. Leading and trailing whitespace is trimmed before validation and persistence.',
            example: 'alex@example.com',
          },
        },
      },
      Booking: {
        type: 'object',
        required: ['id', 'slotId', 'customerName', 'customerEmail', 'status'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          slotId: { type: 'string', format: 'uuid' },
          customerName: { type: 'string', minLength: 1 },
          customerEmail: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['active', 'cancelled'] },
        },
      },
      BookingResponse: {
        type: 'object',
        required: ['booking'],
        properties: {
          booking: { $ref: '#/components/schemas/Booking' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'SLOT_NOT_FOUND',
                  'SLOT_UNAVAILABLE',
                  'BOOKING_NOT_FOUND',
                  'INTERNAL_ERROR',
                ],
              },
              message: { type: 'string', minLength: 1 },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Invalid JSON or invalid request fields.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'customerEmail must be a valid email address.',
              },
            },
          },
        },
      },
      SlotNotFound: {
        description: 'The requested slot does not exist.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'SLOT_NOT_FOUND',
                message: 'The requested slot was not found.',
              },
            },
          },
        },
      },
      SlotUnavailable: {
        description: 'The slot already has an active booking.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'SLOT_UNAVAILABLE',
                message: 'This slot already has an active booking.',
              },
            },
          },
        },
      },
      BookingNotFound: {
        description: 'The requested booking does not exist.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'BOOKING_NOT_FOUND',
                message: 'The requested booking was not found.',
              },
            },
          },
        },
      },
      InternalError: {
        description: 'Unexpected server or database failure. Internal details are not exposed.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
              },
            },
          },
        },
      },
    },
  },
} as const;