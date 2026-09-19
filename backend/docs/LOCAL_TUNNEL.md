# Local HTTPS tunnel with ngrok

Tunnel the **Fastify API** on port `3000`. This exposes the endpoints external
providers need, while the Vite UI continues to run locally on port `5173`.

```text
Internet / Meta -> https://your-domain.ngrok.app -> ngrok -> http://localhost:3000 (Fastify)
Browser         -> http://localhost:5173 (Vite)   -> https://your-domain.ngrok.app/api/v1
```

Use a separate development hostname and Meta development app. Never point a
production webhook at a developer machine.

## One-time ngrok setup

Install ngrok for Windows, then add the authtoken from the ngrok dashboard:

```powershell
winget install ngrok -s msstore
ngrok config add-authtoken "YOUR_NGROK_AUTHTOKEN"
```

For stable OAuth and webhook URLs, reserve an ngrok domain in your ngrok
dashboard, for example `mega-influencer-dev.ngrok.app`. The tunnel command
below uses it with `--url`. A temporary ngrok URL changes every time the tunnel
is restarted, so it is only suitable for short-lived tests.

## Local environment

In `backend/.env`, use values like these:

```env
PORT=3000
HOST="0.0.0.0"
CLIENT_ORIGIN="http://localhost:5173"
FRONTEND_ORIGIN="http://localhost:5173"
PUBLIC_BASE_URL="https://mega-influencer-dev.ngrok.app"
WEBHOOK_VERIFY_TOKEN="a-private-random-development-token"
```

`META_APP_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, and
`ENCRYPTION_KEY` must be populated with the credentials for the separate
development Meta app. Keep all secrets out of Git.

In `frontend/.env`, route browser API and OAuth requests through the public API
hostname:

```env
VITE_API_BASE_URL=https://mega-influencer-dev.ngrok.app/api/v1
VITE_INSTAGRAM_LOGIN_URL=https://mega-influencer-dev.ngrok.app/api/v1/auth/instagram
```

Restart both development servers after changing either `.env` file.

## Run and verify

Start Fastify and Vite in separate terminals:

```powershell
cd backend; npm run dev
cd frontend; npm run dev
```

Then start the stable ngrok endpoint:

```powershell
ngrok http 3000 --url https://mega-influencer-dev.ngrok.app
```

`npm run tunnel:api` is a shortcut for an ad-hoc tunnel (`ngrok http 3000`).

Check the public API before configuring any provider:

```powershell
Invoke-WebRequest https://mega-influencer-dev.ngrok.app/health
```

For the Meta development app configure:

```text
Instagram OAuth redirect URI: https://mega-influencer-dev.ngrok.app/api/v1/auth/instagram/callback
Webhook callback URL:       https://mega-influencer-dev.ngrok.app/webhooks/instagram
Verify token:               the value of WEBHOOK_VERIFY_TOKEN
```

The webhook endpoint intentionally sits outside `/api/v1`; that is the route
implemented by Fastify. It validates Meta's signature over the raw body.

## Temporary URL option

For an ad-hoc HTTPS URL, run:

```powershell
npm run tunnel:api
```

Copy the HTTPS URL ngrok prints into `PUBLIC_BASE_URL` and both frontend
`VITE_*` URLs above. This URL changes every run, so it is unsuitable for a
saved OAuth redirect URI or webhook callback. Use a reserved ngrok domain for
normal development.

## Temporarily forward production webhooks to local ngrok

If Meta is permanently configured with the production callback URL, set these
variables in the **live Fastify server's** environment while you are actively
testing:

```env
SEND_META_WEBHOOKS_TO_LOCAL="true"
LOCAL_URL="https://mega-influencer-dev.ngrok.app"
```

Restart the Fastify process after changing them. The live server validates the
Meta signature, forwards the original raw payload and signature to
`LOCAL_URL/webhooks/instagram`, and deliberately skips its own database
processing so an event is not processed twice.

Your local `.env` must use the same `META_APP_SECRET`, and must keep
`SEND_META_WEBHOOKS_TO_LOCAL="false"`. When testing is complete, set the live
server value back to `false` and restart it. This sends real production events
to your computer, so never leave it enabled.
