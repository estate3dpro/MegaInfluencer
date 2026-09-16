import { describe, expect, it } from 'vitest';

import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { requireAuth, requireRole } from './authorization.js';

describe('authorization helpers', () => {
  it('rejects a request without an authenticated actor', () => {
    expect(() => requireAuth({} as never)).toThrow(UnauthorizedError);
  });

  it('rejects an actor without an allowed role', () => {
    const request = { actor: { userId: 'user-1', role: 'INFLUENCER' } };
    expect(() => requireRole(request as never, ['STORE_OWNER'])).toThrow(ForbiddenError);
  });
});
