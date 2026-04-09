# BidWave Database Schema

## Core entities

### users

- `id`
- `email`
- `display_name`
- `avatar_url`
- `role`
- `country_code`
- `created_at`
- `updated_at`

### seller_profiles

- `id`
- `user_id`
- `store_name`
- `bio`
- `status`
- `risk_level`
- `payout_hold_days`
- `created_at`
- `updated_at`

### seller_verifications

- `id`
- `seller_profile_id`
- `provider`
- `provider_reference`
- `status`
- `submitted_at`
- `reviewed_at`

### shows

- `id`
- `seller_id`
- `title`
- `slug`
- `description`
- `status`
- `scheduled_for`
- `started_at`
- `ended_at`
- `stream_room_id`
- `cover_image_url`

### show_items

- `id`
- `show_id`
- `seller_id`
- `title`
- `description`
- `category`
- `condition`
- `image_url`
- `pricing_mode`
- `buy_now_price`
- `currency`

### auctions

- `id`
- `show_item_id`
- `status`
- `start_price`
- `reserve_price`
- `minimum_increment`
- `starts_at`
- `ends_at`
- `extended_until`
- `winner_user_id`
- `winning_bid_id`

### bids

- `id`
- `auction_id`
- `user_id`
- `amount`
- `status`
- `placed_at`
- `client_nonce`

### orders

- `id`
- `buyer_id`
- `seller_id`
- `show_id`
- `status`
- `currency`
- `subtotal_amount`
- `platform_fee_amount`
- `payment_processing_fee_amount`
- `shipping_amount`
- `tax_amount`
- `total_amount`
- `placed_at`

### order_items

- `id`
- `order_id`
- `show_item_id`
- `pricing_mode`
- `unit_amount`
- `quantity`

### payments

- `id`
- `order_id`
- `provider`
- `provider_payment_id`
- `status`
- `authorized_amount`
- `captured_amount`
- `refunded_amount`
- `created_at`

### payouts

- `id`
- `seller_id`
- `provider`
- `provider_payout_id`
- `status`
- `amount`
- `scheduled_for`
- `released_at`

### shipments

- `id`
- `order_id`
- `carrier`
- `tracking_number`
- `status`
- `shipped_at`
- `delivered_at`

### disputes

- `id`
- `order_id`
- `opened_by_user_id`
- `reason`
- `status`
- `resolution`
- `opened_at`
- `resolved_at`

### chat_messages

- `id`
- `show_id`
- `user_id`
- `message`
- `status`
- `created_at`

### moderation_flags

- `id`
- `entity_type`
- `entity_id`
- `reason`
- `status`
- `created_by`
- `created_at`

## State notes

### show.status

- `draft`
- `scheduled`
- `live`
- `ended`
- `cancelled`

### auction.status

- `scheduled`
- `live`
- `ended`
- `settled`
- `cancelled`

### order.status

- `pending_payment`
- `paid`
- `fulfillment_pending`
- `shipped`
- `delivered`
- `refunded`
- `cancelled`

### seller_profiles.status

- `pending_review`
- `approved`
- `rejected`
- `paused`
