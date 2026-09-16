# Mega Influencer API

Fastify + TypeScript API using PostgreSQL via Prisma.

## Project structure

```
src/
  config/       # Environment configuration
  modules/      # Feature modules (routes, services, schemas)
  plugins/      # Shared Fastify integrations (Prisma, CORS)
  routes/       # Central route registration
  types/        # Fastify type extensions
  app.ts        # Application composition
  server.ts     # HTTP server entry point
prisma/         # Prisma schema and migrations
```

## First run

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL database.
2. Install dependencies with `npm install`.
3. Generate the Prisma client: `npm run prisma:generate`.
4. Create the first migration when models are added: `npm run prisma:migrate -- --name init`.
5. Start the API: `npm run dev`.

The API listens on `http://localhost:3000` by default. `GET /health` checks the API and database connection.

`GET /ready` is the readiness endpoint for deployments. Test commands use Fastify's in-process request injection; set `TEST_DATABASE_URL` to a dedicated disposable PostgreSQL database before adding database integration tests.

## Phase 1 setup

1. Set a unique, high-entropy `JWT_SECRET` in `.env`.
2. Apply the checked-in database migration with `npx prisma migrate deploy`.
3. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME`, then run `npm run admin:bootstrap` once.

Public registration (`POST /api/v1/auth/register`) only accepts `STORE_OWNER` and `INFLUENCER`. Admin accounts can only be created through the bootstrap command.

In development, Fastify logs are formatted by `pino-pretty`. Set `LOG_LEVEL` to `debug`, `info`, `warn`, or `error` as needed. Production emits JSON logs for log aggregation.
