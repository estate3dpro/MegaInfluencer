import Fastify from 'fastify';

import { config } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerAuth } from './plugins/auth.js';
import { registerErrorHandling } from './plugins/error-handler.js';
import { registerPrisma } from './plugins/prisma.js';
import { registerRoutes } from './routes/index.js';

export function buildApp() {
  const app = Fastify({
    // Campaign cover uploads are currently sent as image data URLs. Keep this
    // deliberately bounded until object-storage uploads replace this MVP path.
    bodyLimit: 6 * 1024 * 1024,
    logger:
      config.nodeEnv === 'test'
        ? false
        : config.nodeEnv === 'development'
        ? {
            level: config.logLevel,
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
          }
        : { level: config.logLevel },
  });
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    if (request.url.split('?')[0] === '/webhooks/instagram') return done(null, body);
    try {
      done(null, JSON.parse(body.toString('utf8')));
    } catch (error) {
      done(error as Error, undefined);
    }
  });
  registerErrorHandling(app);
  registerPrisma(app);
  registerAuth(app);
  registerCors(app);
  registerRoutes(app);

  return app;
}
