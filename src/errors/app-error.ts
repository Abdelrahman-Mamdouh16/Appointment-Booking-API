export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'SLOT_NOT_FOUND'
  | 'SLOT_UNAVAILABLE'
  | 'BOOKING_NOT_FOUND'
  | 'INTERNAL_ERROR';

const statusCodes: Record<AppErrorCode, number> = {
  VALIDATION_ERROR: 400,
  SLOT_NOT_FOUND: 404,
  SLOT_UNAVAILABLE: 409,
  BOOKING_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCodes[code];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}