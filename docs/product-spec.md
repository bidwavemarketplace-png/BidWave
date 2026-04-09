# BidWave Product Spec

## Product summary

BidWave is a live-shopping marketplace for collectibles in Central Europe. Sellers host live shows, list products in real time, and run fast auctions or fixed-price drops. Buyers join the stream, chat, bid, and check out without leaving the show.

## Problem

Live-commerce products built for the US or UK often do not support sellers in CZ/SK. Local communities still trade through fragmented channels like Instagram, Discord, Facebook groups, and informal forums. That creates trust, logistics, and fraud issues.

## MVP goal

Launch an invite-only marketplace for one high-engagement vertical and validate:

- sellers will stream consistently
- buyers will trust the platform enough to save payment details
- the platform can convert live viewers into paid orders

## Ideal first vertical

- Pokemon cards
- sports cards
- TCG accessories
- graded collectibles

These categories already have strong auction behavior and collector communities.

## Core user types

### Buyer

- watches live shows
- bids on auction items
- buys fixed-price items
- tracks orders and support cases

### Seller

- applies to sell
- passes KYC/KYB checks
- creates and schedules live shows
- runs auctions and fixed-price drops
- fulfills orders and receives payouts

### Admin / Operations

- reviews seller applications
- moderates chat and listings
- resolves disputes
- controls payout risk

## MVP features

### Buyer

- sign up and sign in
- browse upcoming and live shows
- join a live room
- send chat messages
- place bids in realtime
- purchase buy-now items
- complete one-time bid readiness setup with shipping address, default shipping method, and saved payment method
- view order history
- open a support case

### Seller

- complete seller profile
- submit verification details
- schedule a show
- go live
- create auction items during a show
- create buy-now drops
- see sold items and pending fulfillment
- print or upload tracking references

### Platform

- seller approval queue
- item moderation
- payment capture and payout scheduling
- refund and dispute workflows
- event logging and risk flags

## Non-goals for MVP

- mystery packs
- advanced recommendation feed
- referrals and affiliate systems
- multi-country tax automation
- warehouse fulfillment
- creator tipping economy

## Key product rules

### Auction rules

- each auction has a start price, minimum increment, reserve optionality, and countdown timer
- bids are accepted only by the server
- bids received in the final seconds extend the auction to reduce sniping
- the highest accepted bid wins

### Payment rules

- buyer must complete bid readiness before the first bid on the platform
- bid readiness stores default shipping address, default shipping method, saved payment method, and consent for automatic charges
- every won lot is charged immediately so the seller can open the pack or item without waiting for buyer confirmation
- shipping is not charged per lot; all wins from the same buyer in the same show from the same seller are grouped into one shipment
- one shipping charge is created after the stream checkout group is finalized
- if a lot charge or later shipping charge fails, the buyer enters recovery and cannot continue bidding until payment is fixed

### Shipping rules

- shipping preference is selected once during bid readiness and reused on future shows
- shipping method for a given stream checkout group can be changed only until the buyer wins the first lot in that stream
- all wins in one stream from one seller should reuse one shipment group by default
- seller should see one fulfillment group, not one parcel decision per won lot

### Seller trust rules

- new sellers have payout delay
- higher-risk categories require approval
- repeated support or counterfeit issues can freeze payouts

## Metrics to track

- live show attendance
- average watch time
- bid conversion rate
- orders per show
- GMV per seller
- unpaid win rate
- bid readiness completion rate
- immediate lot payment success rate
- grouped shipping recovery rate
- dispute rate
- seller retention after first 30 days

## Recommended launch strategy

### Geography

Launch in one country first. Czech Republic is likely the smoother first market because of population density and ecommerce familiarity, but either CZ or SK can work if you already have seller relationships there.

### Supply strategy

- recruit 10 to 20 curated sellers
- onboard them manually
- co-plan their first shows
- collect qualitative buyer feedback during pilot

### Demand strategy

- invite collector communities from Instagram and Discord
- promote scheduled drops before each show
- use clips and countdowns to build anticipation

## Success criteria for MVP

- 10 active sellers
- 50 completed shows
- 500 total buyers
- 25% of live shows convert to at least one paid order
- dispute rate below 2%
