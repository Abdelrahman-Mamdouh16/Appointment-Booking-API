import Joi from 'joi';

export const createBookingBodySchema = Joi.object({
  slotId: Joi.string().guid().required().messages({
    'any.required': 'slotId is required.',
    'string.base': 'slotId must be a string.',
    'string.empty': 'slotId is required.',
    'string.guid': 'slotId must be a valid UUID.',
  }),
  customerName: Joi.string().trim().min(1).required().messages({
    'any.required': 'customerName is required.',
    'string.base': 'customerName must be a string.',
    'string.empty': 'customerName cannot be empty.',
    'string.min': 'customerName cannot be empty.',
  }),
  customerEmail: Joi.string().trim().email().required().messages({
    'any.required': 'customerEmail is required.',
    'string.base': 'customerEmail must be a string.',
    'string.empty': 'customerEmail is required.',
    'string.email': 'customerEmail must be a valid email address.',
  }),
})
  .required()
  .messages({
    'any.required': 'Request body is required.',
    'object.base': 'Request body must be a JSON object.',
  });

export const bookingIdParamsSchema = Joi.object({
  bookingId: Joi.string().guid().required().messages({
    'any.required': 'bookingId is required.',
    'string.base': 'bookingId must be a string.',
    'string.empty': 'bookingId is required.',
    'string.guid': 'bookingId must be a valid UUID.',
  }),
}).required();