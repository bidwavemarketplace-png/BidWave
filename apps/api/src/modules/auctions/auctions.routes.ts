import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  clearMaxBidForUser,
  closeMockAuction,
  getAuctionByShowId,
  getBuyerBidReadiness,
  getMaxBidForUser,
  listMaxBidsForUser,
  placeMockBid,
  saveMaxBidForUser,
  settleMockAuctionLot
} from "../../data/mock-store";

const createAuctionSchema = z.object({
  showItemId: z.string().min(3),
  startPrice: z.number().nonnegative(),
  minimumIncrement: z.number().positive(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime()
});

const placeBidSchema = z.object({
  amount: z.number().positive(),
  clientNonce: z.string().min(8),
  userId: z.string().min(3).optional(),
  buyerName: z.string().min(1).optional()
});

const maxBidQuerySchema = z.object({
  userId: z.string().min(3)
});

const maxBidBodySchema = z.object({
  userId: z.string().min(3),
  buyerName: z.string().min(1),
  maxAmount: z.number().positive()
});

export async function registerAuctionRoutes(app: FastifyInstance) {
  const settleAuctionSchema = z.object({
    userId: z.string().min(3),
    buyerName: z.string().min(1)
  });

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
    const params = z.object({ auctionId: z.string() }).parse(request.params);
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
    const params = z.object({ auctionId: z.string() }).parse(request.params);

    return {
      auctionId: params.auctionId,
      status: "ended",
      settlement: "payment_required"
    };
  });

  app.get("/shows/:showId/auction", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const auction = getAuctionByShowId(params.showId);

    if (!auction) {
      reply.code(404);
      return {
        message: "Auction not found for this show"
      };
    }

    return auction;
  });

  app.post("/shows/:showId/auction/bids", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = placeBidSchema.parse(request.body);
    const readiness = getBuyerBidReadiness(payload.userId ?? "mobile-demo-user");

    if (!readiness.ready) {
      reply.code(403);
      return {
        accepted: false,
        reason: "bid_readiness_required",
        message: "Complete bid readiness before placing the first bid."
      };
    }

    const result = placeMockBid(
      params.showId,
      payload.amount,
      payload.userId ?? "mobile-demo-user",
      payload.buyerName ?? "You"
    );

    if (!result) {
      reply.code(404);
      return {
        message: "Auction not found for this show"
      };
    }

    if (!result.accepted && result.reason === "already_highest_bidder") {
      reply.code(409);
      return {
        message: "You are already the top bidder on this lot."
      };
    }

    return {
      accepted: result.accepted,
      minimumValidAmount: result.minimumValidAmount,
      auction: result.auction
    };
  });

  app.post("/shows/:showId/auction/settle", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = settleAuctionSchema.parse(request.body);
    const readiness = getBuyerBidReadiness(payload.userId);

    if (!readiness.ready) {
      reply.code(403);
      return {
        message: "Bid readiness required"
      };
    }

    const settlement = settleMockAuctionLot({
      showId: params.showId,
      userId: payload.userId,
      buyerName: payload.buyerName
    });

    if (!settlement) {
      if (settlement === null) {
        reply.code(409);
        return {
          message: "Auction must be ended and settled by the current winner only."
        };
      }

      reply.code(404);
      return {
        message: "Auction not found for settlement"
      };
    }

    return settlement;
  });

  app.post("/shows/:showId/auction/close", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const auction = closeMockAuction(params.showId);

    if (!auction) {
      reply.code(404);
      return {
        message: "Auction not found for this show"
      };
    }

    return {
      status: auction.status,
      endsAt: auction.endsAt
    };
  });

  app.get("/buyer/max-bids", async (request) => {
    const query = maxBidQuerySchema.parse(request.query);
    return {
      items: listMaxBidsForUser(query.userId)
    };
  });

  app.get("/shows/:showId/items/:itemId/max-bid", async (request, reply) => {
    const params = z.object({ showId: z.string(), itemId: z.string() }).parse(request.params);
    const query = maxBidQuerySchema.parse(request.query);
    const saved = getMaxBidForUser(params.showId, params.itemId, query.userId);

    if (!saved) {
      reply.code(404);
      return {
        message: "Max bid not found"
      };
    }

    return saved;
  });

  app.post("/shows/:showId/items/:itemId/max-bid", async (request, reply) => {
    const params = z.object({ showId: z.string(), itemId: z.string() }).parse(request.params);
    const payload = maxBidBodySchema.parse(request.body);
    const readiness = getBuyerBidReadiness(payload.userId);

    if (!readiness.ready) {
      reply.code(403);
      return {
        message: "Complete bid readiness before setting a max bid."
      };
    }

    const saved = saveMaxBidForUser({
      showId: params.showId,
      itemId: params.itemId,
      userId: payload.userId,
      buyerName: payload.buyerName,
      maxAmount: payload.maxAmount
    });

    reply.code(201);
    return saved;
  });

  app.delete("/shows/:showId/items/:itemId/max-bid", async (request, reply) => {
    const params = z.object({ showId: z.string(), itemId: z.string() }).parse(request.params);
    const query = maxBidQuerySchema.parse(request.query);
    const removed = clearMaxBidForUser(params.showId, params.itemId, query.userId);

    if (!removed) {
      reply.code(404);
      return {
        message: "Max bid not found"
      };
    }

    return {
      removed: true
    };
  });
}
