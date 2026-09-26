import type { FastifyInstance } from 'fastify';

import { AppError } from '../shared/errors/app-error.js';
import { config } from '../config/env.js';

export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} was not found.`,
        requestId: request.id,
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const isAppError = error instanceof AppError;
    const isValidationError =
      typeof error === 'object' && error !== null && 'validation' in error && Boolean(error.validation);
    const isBodyTooLarge =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 'FST_ERR_CTP_BODY_TOO_LARGE';

    const statusCode = isAppError
      ? error.statusCode
      : isValidationError
      ? 400
      : isBodyTooLarge
      ? 413
      : (error as any).statusCode || (error as any).status || 500;

    const prismaCode = (error as any)?.code?.startsWith?.('P') ? (error as any).code : undefined;
    const code = isAppError
      ? error.code
      : isValidationError
      ? 'VALIDATION_ERROR'
      : isBodyTooLarge
      ? 'IMAGE_TOO_LARGE'
      : prismaCode || (error as any).code || 'INTERNAL_ERROR';

    const rawMessage = error instanceof Error ? error.message : String(error);

    // Provide descriptive messages in development / staging or for AppErrors
    const message = isAppError
      ? error.message
      : isValidationError
      ? `Request validation failed: ${rawMessage}`
      : isBodyTooLarge
      ? 'The image is too large. Choose an image under 4 MB.'
      : config.nodeEnv !== 'production'
      ? rawMessage || 'An unexpected error occurred.'
      : 'An unexpected error occurred.';

    const errStack = error instanceof Error ? error.stack : undefined;
    const errMeta = (error as any)?.meta;

    // High-visibility ANSI Color Console Output for Developers
    const colorReset = '\x1b[0m';
    const colorRed = '\x1b[31;1m';
    const colorYellow = '\x1b[33m';
    const colorGray = '\x1b[90m';
    const colorBold = '\x1b[1m';
    const colorCyan = '\x1b[36m';

    console.error(`\n${colorRed}━━━ [API ERROR] ${request.method} ${request.url} ━━━${colorReset}`);
    console.error(`${colorBold}Status Code:${colorReset} ${colorRed}${statusCode}${colorReset} (${colorYellow}${code}${colorReset})`);
    console.error(`${colorBold}Request ID:${colorReset}  ${colorCyan}${request.id}${colorReset}`);
    console.error(`${colorBold}Error Message:${colorReset} ${colorRed}${rawMessage}${colorReset}`);

    if (errMeta) {
      console.error(`${colorBold}Prisma Meta:${colorReset} ${colorYellow}${JSON.stringify(errMeta)}${colorReset}`);
    }

    if (errStack) {
      console.error(`${colorBold}Stack Trace:${colorReset}\n${colorGray}${errStack}${colorReset}`);
    }
    console.error(`${colorRed}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colorReset}\n`);

    app.log.error(
      {
        err: error,
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode,
        code,
      },
      `Request failed: ${request.method} ${request.url} (${statusCode} ${code}) - ${rawMessage}`
    );

    return reply.status(statusCode).send({
      error: {
        code,
        message,
        requestId: request.id,
        ...(config.nodeEnv !== 'production' && !isAppError ? { details: rawMessage, stack: errStack } : {}),
      },
    });
  });
}
