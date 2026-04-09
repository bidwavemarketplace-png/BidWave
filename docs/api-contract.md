# BidWave API Contract

## Health

### `GET /health`

Returns service and version status.

## Auth

### `POST /auth/register`

Creates a buyer account.

Request body:

```json
{
  "email": "buyer@example.com",
  "password": "strong-password",
  "displayName": "collector01"
}
```

### `POST /auth/login`

Returns a session token or sets a secure cookie session.

## Buyer checkout

### `GET /buyer/bid-readiness`

Returns whether the buyer is cleared to bid immediately and what defaults are stored on the account.

Response shape:

```json
{
  "ready": true,
  "defaultShippingAddressId": "addr_123",
  "defaultShippingMethodId": "ship_method_home",
  "defaultPaymentMethodId": "pm_123",
  "termsAcceptedAt": "2026-04-01T18:10:00.000Z"
}
```

### `POST /buyer/bid-readiness`

Creates or updates the buyer's one-time bidding setup.

Request body:

```json
{
  "address": {
    "fullName": "Tomas Dobias",
    "line1": "Main Street 12",
    "city": "Brno",
    "postalCode": "60200",
    "countryCode": "CZ",
    "phone": "+420123456789"
  },
  "defaultShippingMethodId": "ship_method_home",
  "paymentMethodToken": "pm_123",
  "acceptsInstantLotCharges": true,
  "acceptsGroupedShippingCharges": true
}
```

### `PATCH /buyer/default-shipping-method`

Updates the default shipping method used for future stream checkout groups.

### `PATCH /buyer/default-shipping-address`

Updates the default shipping address used for future stream checkout groups.

## Shows

### `GET /shows`

List scheduled and live shows.

Query params:

- `status`
- `country`
- `category`

### `POST /shows`

Create a seller show.

### `GET /shows/:showId`

Return show details, items, and seller info.

### `GET /shows/:showId/auction`

Return the current auction state for the live room.

### `POST /shows/:showId/go-live`

Move a scheduled show into live state.

### `POST /shows/:showId/auction/bids`

Submit a bid against the show-scoped live auction state.

Bid rejection rules:

- reject when buyer bid readiness is incomplete
- reject when buyer is in payment recovery
- reject when stream checkout group is locked for fraud or payment reasons

## Seller onboarding

### `GET /seller-applications`

List current seller applications in the review queue.

### `POST /seller-applications`

Create a new seller application.

Request body:

```json
{
  "userId": "usr_123",
  "storeName": "CardCellar CZ",
  "legalName": "CardCellar s.r.o.",
  "countryCode": "CZ",
  "categoryFocus": "Pokemon cards"
}
```

### `GET /sellers/:sellerId/dashboard`

Return seller summary, scheduled shows, and recent orders for the dashboard shell.

## Auctions

### `POST /auctions`

Create an auction for a show item.

### `POST /auctions/:auctionId/bids`

Submit a bid.

Request body:

```json
{
  "amount": 52.5,
  "clientNonce": "5de865d2-77ae-4d52-a124-31a51c87d8a9"
}
```

Response shape:

```json
{
  "accepted": true,
  "currentPrice": 52.5,
  "highestBidderId": "usr_123",
  "endsAt": "2026-04-01T18:45:00.000Z"
}
```

### `POST /auctions/:auctionId/close`

Closes the auction and begins settlement.

### `POST /auctions/:auctionId/settle`

Settles the winning bid, charges the product immediately, and attaches the lot to the buyer's shipment group for this show.

Response shape:

```json
{
  "status": "paid",
  "lotPaymentId": "pay_lot_123",
  "shipmentGroupId": "ship_group_123",
  "chargedAmount": 215.0,
  "currency": "EUR",
  "openable": true
}
```

## Orders

### `POST /orders`

Create an order from a buy-now purchase or a settled auction.

### `GET /orders`

List buyer orders.

### `GET /orders/:orderId`

Return order details and payment state.

## Shipping groups

### `GET /shipment-groups/:shipmentGroupId`

Returns the current grouped shipping summary for one buyer + seller + show.

### `POST /shipment-groups/:shipmentGroupId/finalize`

Locks the group, calculates one shipping amount for all won lots in that show, and charges shipping from the saved payment method.

Response shape:

```json
{
  "status": "shipping_paid",
  "shipmentGroupId": "ship_group_123",
  "lotsCount": 4,
  "shippingAmount": 6.9,
  "currency": "EUR"
}
```

### `POST /shipment-groups/:shipmentGroupId/retry-shipping-charge`

Retries a failed grouped shipping payment after the buyer updates their payment method.

## Websocket events

### Client to server

- `room:join`
- `chat:send`
- `auction:bid`
- `show:presence`

### Server to client

- `show:state.updated`
- `auction:state.updated`
- `auction:bid.accepted`
- `auction:bid.rejected`
- `chat:message.created`
- `order:settlement.required`
- `auction:settlement.completed`
- `shipment-group:updated`
