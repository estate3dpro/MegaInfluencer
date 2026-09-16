process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-only-secret-that-is-never-used-outside-vitest';
