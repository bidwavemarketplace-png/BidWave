# BidWave Deployment Notes

## Current blockers

- The mobile app currently points to `EXPO_PUBLIC_API_BASE_URL`.
- The API currently uses an in-memory mock store in `apps/api/src/data/mock-store.ts`.
- Without a real database, shows, bids, reminders, orders, and viewer state are lost when the API restarts.

## Recommended first production setup

### 1. API hosting

Deploy `apps/api` as a public Node service.

Suggested simple options:
- Railway
- Render

Environment variables required by the API:

```bash
NODE_ENV=production
PORT=4001
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_WS_URL=wss://your-livekit-domain
```

Production start command:

```bash
npm --workspace @bidwave/api run build
npm --workspace @bidwave/api run start
```

This repo now includes `railway.json` at the workspace root, so Railway can use:
- build: `npm install && npm run build:api`
- start: `npm --workspace @bidwave/api run start`

### Railway quick setup

1. Create a new Railway project from the `BidWave` repo folder.
2. Railway will detect `railway.json`.
3. Add the environment variables from `apps/api/.env.example`.
4. Deploy.
5. After the first deploy, copy the public Railway URL.

### 2. Live streaming

Use a public LiveKit server or LiveKit Cloud so viewers can connect from anywhere.

The API already supports this via `LIVEKIT_WS_URL`. If it is set, the streaming token route returns that public WebSocket URL instead of a local `ws://...:7880`.

### LiveKit Cloud quick setup

1. Create a project in LiveKit Cloud.
2. Copy:
   - API key
   - API secret
   - WebSocket URL (`wss://...`)
3. Put those values into Railway:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_WS_URL`

### 3. Mobile app config

Set the mobile API base URL in `ResellScanner/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-public-api-domain
```

Then rebuild / restart the mobile app so Expo picks up the new env.

### Mobile test checklist

1. Update `ResellScanner/.env` with the Railway public URL.
2. Restart Expo:

```bash
cd /Users/tomasdobias/Projects/ResellScanner
npx expo start --dev-client --clear
```

3. If native modules changed, rebuild the dev client:

```bash
cd /Users/tomasdobias/Projects/ResellScanner
npx expo run:ios --device
```

## Production hardening still needed

- Replace the mock store with a database-backed store
- Persist users, shows, lots, bids, max bids, orders, reminders, and shipping data
- Add server-side push notifications for early starts and lot keyword alerts
- Add object storage for lot images
- Add real shipping provider integrations and tracking webhooks
- Add payout release logic tied to delivery confirmation / tracking
