import type { FastifyInstance } from 'fastify';

import { AppError } from '../shared/errors/app-error.js';

export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
        requestId: request.id,
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const isAppError = error instanceof AppError;
    const isValidationError =
      typeof error === 'object' && error !== null && 'validation' in error && Boolean(error.validation);
    const isBodyTooLarge = typeof error === 'object' && error !== null && 'code' in error && error.code === 'FST_ERR_CTP_BODY_TOO_LARGE';
    const statusCode = isAppError ? error.statusCode : isValidationError ? 400 : isBodyTooLarge ? 413 : 500;
    const code = isAppError ? error.code : isValidationError ? 'VALIDATION_ERROR' : isBodyTooLarge ? 'IMAGE_TOO_LARGE' : 'INTERNAL_ERROR';
    const message = isAppError
      ? error.message
      : isValidationError
        ? 'Request validation failed.'
        : isBodyTooLarge
          ? 'The image is too large. Choose an image under 4 MB.'
        : 'An unexpected error occurred.';

    app.log.error(
      {
        err: error,
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      'Request failed',
    );

    return reply.status(statusCode).send({
      error: { code, message, requestId: request.id },
    });
  });
}
