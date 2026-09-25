import type { RequestHandler } from 'express';
import type Joi from 'joi';
import { AppError } from '../errors/app-error.js';

type RequestPart = 'body' | 'params' | 'query';

export const validate = (schema: Joi.Schema, part: RequestPart): RequestHandler => {
  return (request, _response, next) => {
    const { error, value } = schema.validate(request[part], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join('; ');
      next(new AppError('VALIDATION_ERROR', message));
      return;
    }

    request[part] = value;
    next();
  };
};

export const rejectRequestInput: RequestHandler = (request, _response, next) => {
  if (Object.keys(request.query).length > 0) {
    next(new AppError('VALIDATION_ERROR', 'This endpoint does not accept query parameters.'));
    return;
  }

  if (request.body !== undefined) {
    next(new AppError('VALIDATION_ERROR', 'This endpoint does not accept a request body.'));
    return;
  }

  next();
};