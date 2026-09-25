import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

type JsonParseError = SyntaxError & {
  type?: string;
};

const isJsonParseError = (error: unknown): error is JsonParseError => {
  return error instanceof SyntaxError && (error as JsonParseError).type === 'entity.parse.failed';
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (isJsonParseError(error)) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body contains invalid JSON.',
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};