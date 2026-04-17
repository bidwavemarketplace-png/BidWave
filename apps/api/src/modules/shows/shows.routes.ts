import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  addShowQueueItem,
  cancelShow,
  countShowLikes,
  createShow,
  endStream,
  goLive,
  getShowDetail,
  isShowLikedByUser,
  listSellerShows,
  listShowQueue,
  moveQueueItem,
  mockShows,
  searchCatalog,
  toggleShowLike,
  touchViewerPresence,
  clearViewerPresence,
  updateShow,
  startNextQueuedAuction
} from "../../data/mock-store";

const createShowSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(3),
  scheduledFor: z.string().datetime(),
  category: z.string().min(2),
  sellerId: z.string().min(3),
  sellerName: z.string().min(2),
  lineupHidden: z.boolean().optional()
});

const queueItemSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  pricingMode: z.enum(["auction", "buy_now"]),
  startPrice: z.number().positive().optional(),
  buyNowPrice: z.number().positive().optional(),
  currency: z.enum(["EUR", "CZK"]).optional(),
  imageUrl: z.string().min(1).optional()
});

const moveQueueItemSchema = z.object({
  direction: z.enum(["up", "down"])
});

const updateShowSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(3),
  scheduledFor: z.string().datetime(),
  lineupHidden: z.boolean().optional()
});

const viewerPresenceSchema = z.object({
  viewerId: z.string().min(4),
  source: z.enum(["discover", "live_show"]).optional()
});

const showDetailQuerySchema = z.object({
  userId: z.string().optional()
});

const showLikeToggleSchema = z.object({
  userId: z.string().min(1)
});

export async function registerShowRoutes(app: FastifyInstance) {
  app.get("/shows", async (request) => {
    const query = z
      .object({
        status: z.string().optional(),
        category: z.string().optional(),
        country: z.string().optional(),
        sellerId: z.string().optional(),
        userId: z.string().optional()
      })
      .parse(request.query);

    const sellerFiltered = query.sellerId
      ? listSellerShows(query.sellerId)
      : mockShows;

    const statusFiltered = query.status
      ? sellerFiltered.filter((item) => item.status === query.status)
      : sellerFiltered;

    return {
      filters: query,
      items: statusFiltered.map((item) => ({
        ...item,
        likeCount: countShowLikes(item.id),
        likedByUser: isShowLikedByUser(item.id, query.userId)
      }))
    };
  });

  app.get("/catalog/search", async (request) => {
    const query = z.object({ q: z.string().optional().default("") }).parse(request.query);

    return {
      items: searchCatalog(query.q)
    };
  });

  app.post("/shows", async (request, reply) => {
    const payload = createShowSchema.parse(request.body);
    const created = createShow({
      title: payload.title,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      scheduledFor: payload.scheduledFor,
      lineupHidden: payload.lineupHidden
    });

    reply.code(201);
    return {
      ...created,
      description: payload.description,
      category: payload.category
    };
  });

  app.patch("/shows/:showId", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = updateShowSchema.parse(request.body);
    const updated = updateShow({
      showId: params.showId,
      title: payload.title,
      description: payload.description,
      scheduledFor: payload.scheduledFor,
      lineupHidden: payload.lineupHidden
    });

    if (updated === undefined) {
      reply.code(404);
      return { message: "Show not found" };
    }

    if (updated === null) {
      reply.code(409);
      return { message: "Live show cannot be edited here" };
    }

    return {
      ...updated,
      description: payload.description
    };
  });

  app.get("/shows/:showId", async (request) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const query = showDetailQuerySchema.parse(request.query);
    const show = getShowDetail(params.showId, query.userId);

    return show ?? {
      id: params.showId,
      title: "Placeholder show detail",
      status: "scheduled",
      description: "Show detail missing from mock data.",
      viewers: 0,
      coverImage: "",
      streamRoomId: "room_placeholder",
      likeCount: 0,
      likedByUser: false,
      seller: {
        id: "seller_placeholder",
        storeName: "BidWave Pilot Seller"
      },
      items: []
    };
  });

  app.post("/shows/:showId/viewers/heartbeat", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = viewerPresenceSchema.parse(request.body);
    const show = getShowDetail(params.showId);

    if (!show) {
      reply.code(404);
      return { message: "Show not found" };
    }

    const presence = touchViewerPresence({
      showId: params.showId,
      viewerId: payload.viewerId,
      source: payload.source
    });

    return {
      ok: true,
      presence
    };
  });

  app.delete("/shows/:showId/viewers/:viewerId", async (request, reply) => {
    const params = z.object({ showId: z.string(), viewerId: z.string() }).parse(request.params);
    const cleared = clearViewerPresence(params.showId, params.viewerId);

    if (!cleared) {
      reply.code(404);
      return { message: "Viewer presence not found" };
    }

    return { ok: true };
  });

  app.get("/shows/:showId/queue", async (request) => {
    const params = z.object({ showId: z.string() }).parse(request.params);

    return {
      showId: params.showId,
      items: listShowQueue(params.showId)
    };
  });

  app.post("/shows/:showId/queue", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = queueItemSchema.parse(request.body);
    const show = getShowDetail(params.showId);

    if (!show) {
      reply.code(404);
      return { message: "Show not found" };
    }

    const created = addShowQueueItem({
      showId: params.showId,
      title: payload.title,
      category: payload.category,
      pricingMode: payload.pricingMode,
      imageUrl: payload.imageUrl,
      startPrice: payload.startPrice,
      buyNowPrice: payload.buyNowPrice,
      currency: payload.currency
    });

    if (!created) {
      reply.code(404);
      return { message: "Show not found" };
    }

    reply.code(201);
    return created;
  });

  app.post("/shows/:showId/queue/:itemId/move", async (request, reply) => {
    const params = z.object({ showId: z.string(), itemId: z.string() }).parse(request.params);
    const payload = moveQueueItemSchema.parse(request.body);
    const moved = moveQueueItem({
      showId: params.showId,
      itemId: params.itemId,
      direction: payload.direction
    });

    if (!moved) {
      reply.code(404);
      return { message: "Queue item not found" };
    }

    return {
      showId: params.showId,
      items: moved
    };
  });

  app.post("/shows/:showId/queue/start-next", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const started = startNextQueuedAuction(params.showId);

    if (started === undefined) {
      reply.code(404);
      return { message: "Show not found" };
    }

    if (started === null) {
      reply.code(409);
      return { message: "No queued lots remain" };
    }

    return started;
  });

  app.post("/shows/:showId/likes/toggle", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const payload = showLikeToggleSchema.parse(request.body);
    const result = toggleShowLike(params.showId, payload.userId);

    if (!result) {
      reply.code(404);
      return { message: "Show not found" };
    }

    return result;
  });

  app.post("/shows/:showId/go-live", async (request, reply) => {
    try {
      const params = z.object({ showId: z.string() }).parse(request.params);
      const liveShow = goLive(params.showId);

      if (!liveShow) {
        reply.code(404);
        return {
          message: "Show not found"
        };
      }

      return {
        id: liveShow.id,
        status: liveShow.status,
        streamRoomId: `room_${liveShow.id}`
      };
    } catch (error) {
      request.log.error({ error }, "go-live failed");
      reply.code(500);
      return {
        message: error instanceof Error ? error.message : "Unknown go-live error"
      };
    }
  });

  app.post("/shows/:showId/end-stream", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const ended = endStream(params.showId);

    if (!ended) {
      reply.code(404);
      return { message: "Show not found" };
    }

    return {
      id: ended.id,
      status: ended.status
    };
  });

  app.delete("/shows/:showId", async (request, reply) => {
    const params = z.object({ showId: z.string() }).parse(request.params);
    const removed = cancelShow(params.showId);

    if (removed === undefined) {
      reply.code(404);
      return { message: "Show not found" };
    }

    if (removed === null) {
      reply.code(409);
      return { message: "Live show cannot be cancelled here" };
    }

    return {
      id: removed.id,
      status: "cancelled"
    };
  });
}
