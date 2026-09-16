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
    const statusCode = isAppError ? error.statusCode : isValidationError ? 400 : 500;
    const code = isAppError ? error.code : isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
    const message = isAppError
      ? error.message
      : isValidationError
        ? 'Request validation failed.'
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
