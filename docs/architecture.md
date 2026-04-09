# BidWave Architecture

## Overview

BidWave should be built as a modular marketplace platform with one clear principle: the backend is the source of truth for auction state, payments, and order outcomes.

## Suggested services

### Web app

- marketing pages
- upcoming show discovery
- buyer account
- seller dashboard
- admin tools in a protected route group

### API

- auth and session management
- buyer bid-readiness profile and default checkout preferences
- show creation and lifecycle
- auction orchestration
- order and payment state
- moderation and support workflows

### Realtime gateway

- room presence
- chat events
- bid submission
- auction updates

### Worker processes

- payout scheduling
- shipping group finalization and retry handling
- reminder notifications
- fraud checks
- stream post-processing

## Provider choices

### Video

- LiveKit if you want more control and a modern realtime stack
- Mux if you want easier streaming infrastructure with less custom media work

### Payments

- Stripe Connect for buyer payments and seller payouts

### Storage

- S3-compatible object storage for thumbnails, seller documents, and exports

### Search

- Postgres search for MVP
- upgrade later if feed and catalog complexity grows

## Runtime boundaries

### Synchronous path

- bid readiness setup
- show creation
- auction start and close
- immediate lot settlement
- order read APIs

### Asynchronous path

- grouped shipping charge after stream finalization
- payout release
- shipment reconciliation
- risk reviews
- notification fan-out

## Security principles

- treat bidding as write-sensitive and idempotent
- sign all privileged seller actions with authenticated sessions
- store audit events for payout-affecting state changes
- isolate admin tooling and log moderation actions

## Recommended deployment shape

- `apps/web` deployed on Vercel or similar
- `apps/api` deployed on Fly.io, Railway, Render, or AWS
- Postgres managed instance
- Redis for low-latency auction coordination
- object storage for uploads

## Critical technical decisions

### Auction truth

Do not let the client determine the current highest bid. Clients can render optimistic UI, but only the API or realtime server may accept and commit a winning bid.

### Anti-sniping

When a bid arrives inside the configured last-second window, extend the end time. This is essential for fairness, especially in lower-latency local auctions.

### Payment lock-in

Require buyers to complete a bid-readiness step before their first bid. This should save a payment method for off-session charges, store a default shipping address and shipping method, and record consent for immediate lot charges plus later grouped shipping charges.

### Settlement grouping

Do not model every won lot as a totally isolated shipping decision. Instead, create one shipment group per buyer + seller + show. Each won lot is charged immediately and attached to that shipment group. Shipping is calculated and charged once when the stream group is finalized.
