import Fastify from 'fastify';

import { config } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerAuth } from './plugins/auth.js';
import { registerErrorHandling } from './plugins/error-handler.js';
import { registerPrisma } from './plugins/prisma.js';
import { registerRoutes } from './routes/index.js';

export function buildApp() {
  const app = Fastify({
    bodyLimit: 6 * 1024 * 1024,
    disableRequestLogging: true,
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: config.logLevel ?? 'info',
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
                singleLine: true,
              },
            },
          },
  });

  // Request timing & clean colored HTTP logging hook
  if (config.nodeEnv !== 'test') {
    app.addHook('onRequest', (request, _reply, done) => {
      (request as any).startTime = Date.now();
      done();
    });

    app.addHook('onResponse', (request, reply, done) => {
      const duration = Date.now() - ((request as any).startTime || Date.now());
      const status = reply.statusCode;
      const method = request.method;
      const url = request.url;

      const methodColor =
        method === 'GET' ? '\x1b[36m' : method === 'POST' ? '\x1b[32m' : method === 'DELETE' ? '\x1b[31m' : '\x1b[33m';
      const statusColor = status >= 500 ? '\x1b[31;1m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';

      app.log.info(`${methodColor}${method}${reset} ${url} ${statusColor}${status}${reset} (${duration}ms)`);
      done();
    });
  }

  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    const urlPath = request.url.split('?')[0].replace(/\/+$/, '');
    if (['/webhooks/instagram', '/webhooks/shopify/orders'].includes(urlPath)) return done(null, body);
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
