"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuctionRoutes = registerAuctionRoutes;
const zod_1 = require("zod");
const mock_store_1 = require("../../data/mock-store");
const createAuctionSchema = zod_1.z.object({
    showItemId: zod_1.z.string().min(3),
    startPrice: zod_1.z.number().nonnegative(),
    minimumIncrement: zod_1.z.number().positive(),
    startsAt: zod_1.z.string().datetime(),
    endsAt: zod_1.z.string().datetime()
});
const placeBidSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    clientNonce: zod_1.z.string().min(8)
});
async function registerAuctionRoutes(app) {
    app.post("/auctions", async (request, reply) => {
        const payload = createAuctionSchema.parse(request.body);
        reply.code(201);
        return {
            id: "auc_placeholder",
            status: "scheduled",
            ...payload
        };
    });
    app.post("/auctions/:auctionId/bids", async (request) => {
        const params = zod_1.z.object({ auctionId: zod_1.z.string() }).parse(request.params);
        const payload = placeBidSchema.parse(request.body);
        return {
            accepted: true,
            auctionId: params.auctionId,
            currentPrice: payload.amount,
            endsAt: "2026-04-01T18:45:00.000Z",
            highestBidderId: "usr_placeholder"
        };
    });
    app.post("/auctions/:auctionId/close", async (request) => {
        const params = zod_1.z.object({ auctionId: zod_1.z.string() }).parse(request.params);
        return {
            auctionId: params.auctionId,
            status: "ended",
            settlement: "payment_required"
        };
    });
    app.get("/shows/:showId/auction", async (request, reply) => {
        const params = zod_1.z.object({ showId: zod_1.z.string() }).parse(request.params);
        const auction = (0, mock_store_1.getAuctionByShowId)(params.showId);
        if (!auction) {
            reply.code(404);
            return {
                message: "Auction not found for this show"
            };
        }
        return auction;
    });
    app.post("/shows/:showId/auction/bids", async (request, reply) => {
        const params = zod_1.z.object({ showId: zod_1.z.string() }).parse(request.params);
        const payload = placeBidSchema.parse(request.body);
        const result = (0, mock_store_1.placeMockBid)(params.showId, payload.amount);
        if (!result) {
            reply.code(404);
            return {
                message: "Auction not found for this show"
            };
        }
        return {
            accepted: result.accepted,
            minimumValidAmount: result.minimumValidAmount,
            auction: result.auction
        };
    });
}
