# BidWave

BidWave is a regional live shopping marketplace MVP designed for CZ/SK. It is inspired by the live-auction model popularized by platforms like Whatnot, but shaped around local seller onboarding, EU consumer expectations, and a mobile-first buying flow.

## Repository layout

```text
BidWave/
├── README.md
├── package.json
├── tsconfig.base.json
├── docs/
│   ├── api-contract.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── product-spec.md
│   └── roadmap.md
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config.ts
│   │       ├── lib/
│   │       │   └── errors.ts
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   └── auth.routes.ts
│   │       │   ├── health/
│   │       │   │   └── health.routes.ts
│   │       │   ├── shows/
│   │       │   │   └── shows.routes.ts
│   │       │   └── auctions/
│   │       │       └── auctions.routes.ts
│   │       └── server.ts
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.mjs
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── components/
│           ├── feature-grid.tsx
│           ├── hero.tsx
│           ├── live-show-card.tsx
│           └── stat-bar.tsx
└── packages/
    ├── config/
    │   └── eslint/base.cjs
    ├── db/
    │   └── prisma/schema.prisma
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── auction.ts
            ├── show.ts
            └── user.ts
```

## Product direction

- vertical-first launch focused on collectibles
- invite-only sellers in the first market
- live auctions plus buy-now drops
- buyer protection, moderation, and payout controls from day one

## Suggested first market

Start with one country before opening CZ and SK together. That keeps legal wording, support operations, taxes, and logistics simpler during the pilot.

## How to use this starter

1. Review the spec in `docs/product-spec.md`.
2. Review the data model in `docs/database-schema.md`.
3. Connect real providers:
   - video: LiveKit or Mux
   - payments: Stripe Connect
   - auth: Clerk, Supabase Auth, or custom auth
4. Install dependencies when you are ready:

```bash
cd /Users/tomasdobias/Documents/New\ project/BidWave
npm install
```

5. Start the web app:

```bash
npm run dev:web
```

6. Start the API:

```bash
npm run dev:api
```

## Current state

This repository is a scaffold and product blueprint. It includes:

- a documented MVP plan
- an initial web landing and operator dashboard shell
- a lightweight API structure with seller onboarding, dashboard, and show creation placeholders
- shared TypeScript domain models
- a Prisma schema for the marketplace core

It does not yet include:

- real authentication
- websocket bidding engine
- video ingestion
- payment provider integration
- admin tooling

## Recommended next build order

1. auth and seller onboarding
2. show scheduling and live room setup
3. realtime auction state machine
4. checkout and payment authorization
5. shipment tracking and payouts
6. moderation and support tools
