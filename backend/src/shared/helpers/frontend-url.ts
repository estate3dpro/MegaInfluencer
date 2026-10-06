import type { FastifyRequest } from 'fastify';
import { config } from '../../config/env.js';

/**
 * Resolves the public frontend domain URL for shareable affiliate/referral links.
 * Prioritizes incoming request origin/referer from browser, then configured FRONTEND_ORIGIN or client origins.
 */
export function getFrontendBaseUrl(request?: FastifyRequest): string {
  // 1. Check request origin header (e.g. http://localhost:5173 or https://megainfluencer.megascale.co.in)
  const origin = request?.headers?.origin;
  if (origin && typeof origin === 'string' && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, '');
  }

  // 2. Check request referer header
  const referer = request?.headers?.referer;
  if (referer && typeof referer === 'string' && /^https?:\/\//i.test(referer)) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore
    }
  }

  // 3. Check FRONTEND_ORIGIN from env
  if (config.frontendOrigin) {
    return config.frontendOrigin.replace(/\/+$/, '');
  }

  // 4. Check configured client origins
  if (config.clientOrigins && config.clientOrigins.length > 0) {
    const first = config.clientOrigins[0];
    if (first) return first.replace(/\/+$/, '');
  }

  // 5. Fallback
  return 'http://localhost:5173';
}
