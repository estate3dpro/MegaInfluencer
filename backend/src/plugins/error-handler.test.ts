import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../shared/errors/app-error.js';
import { buildTestApp } from '../test/app.js';

describe('error handling', () => {
  const apps: ReturnType<typeof buildTestApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('returns the standard response for an application error', async () => {
    const app = buildTestApp();
    apps.push(app);
    app.get('/test-error', async () => {
      throw new AppError('TEST_ERROR', 'Expected test failure.', 418);
    });

    const response = await app.inject({ method: 'GET', url: '/test-error' });
    const body = response.json();

    expect(response.statusCode).toBe(418);
    expect(body.error).toMatchObject({
      code: 'TEST_ERROR',
      message: 'Expected test failure.',
    });
    expect(body.error.requestId).toEqual(expect.any(String));
  });

  it('returns the standard response for a missing route', async () => {
    const app = buildTestApp();
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/missing-route' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toMatchObject({ code: 'NOT_FOUND' });
  });
});
