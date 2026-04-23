import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  applyOrderTrackingSnapshot,
  confirmOrderDelivery,
  getOrderDetail,
  getOrderTracking,
  listBuyerOrders,
  saveOrderTracking
} from "../../data/mock-store";

async function refreshPacketaTracking(input: { orderId: string; trackingNumber: string }) {
  const apiPassword = process.env.PACKETA_API_PASSWORD?.trim();
  const endpoint =
    process.env.PACKETA_TRACKING_ENDPOINT?.trim() || "https://www.zasilkovna.cz/api/rest";

  if (!apiPassword) {
    return {
      provider: "packeta" as const,
      trackingNumber: input.trackingNumber,
      status: "tracking_added",
      lastEvent: "Packeta API is not configured yet",
      lastEventAt: undefined,
      updatedAt: new Date().toISOString(),
      source: "manual" as const
    };
  }

  const xmlBody = `<?xml version="1.0" encoding="utf-8"?><data><apiPassword>${apiPassword}</apiPassword><packetId>${input.trackingNumber}</packetId></data>`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    },
    body: xmlBody
  });

  if (!response.ok) {
    throw new Error("Unable to refresh Packeta tracking");
  }

  const xml = await response.text();
  const statusMatch = xml.match(/<status[^>]*>([^<]+)<\/status>/i);
  const nameMatch = xml.match(/<statusText[^>]*>([^<]+)<\/statusText>/i) || xml.match(/<name[^>]*>([^<]+)<\/name>/i);
  const dateMatch = xml.match(/<date[^>]*>([^<]+)<\/date>/i) || xml.match(/<lastChange[^>]*>([^<]+)<\/lastChange>/i);

  return {
    provider: "packeta" as const,
    trackingNumber: input.trackingNumber,
    status: (statusMatch?.[1] || nameMatch?.[1] || "in_transit").trim(),
    lastEvent: nameMatch?.[1]?.trim() || "Packeta tracking updated",
    lastEventAt: dateMatch?.[1]?.trim(),
    updatedAt: new Date().toISOString(),
    source: "packeta_api" as const
  };
}

export async function registerOrderRoutes(app: FastifyInstance) {
  app.get("/orders", async (request) => {
    const query = z
      .object({
        userId: z.string().optional(),
        buyerName: z.string().optional(),
        sellerName: z.string().optional()
      })
      .parse(request.query);

    return {
      items: listBuyerOrders({
        userId: query.userId,
        buyerName: query.buyerName,
        sellerName: query.sellerName
      })
    };
  });

  app.get("/orders/:orderId", async (request, reply) => {
    const params = z.object({ orderId: z.string() }).parse(request.params);
    const order = getOrderDetail(params.orderId);

    if (!order) {
      reply.code(404);
      return {
        message: "Order not found"
      };
    }

    return order;
  });

  app.get("/orders/:orderId/tracking", async (request, reply) => {
    const params = z.object({ orderId: z.string() }).parse(request.params);
    const tracking = getOrderTracking(params.orderId);

    if (!tracking) {
      reply.code(404);
      return {
        message: "Tracking not found"
      };
    }

    return tracking;
  });

  app.post("/orders/:orderId/tracking", async (request, reply) => {
    const params = z.object({ orderId: z.string() }).parse(request.params);
    const payload = z
      .object({
        provider: z.enum(["packeta", "balikovna", "manual"]),
        trackingNumber: z.string().min(3)
      })
      .parse(request.body);

    const updated = saveOrderTracking({
      orderId: params.orderId,
      provider: payload.provider,
      trackingNumber: payload.trackingNumber
    });

    if (!updated) {
      reply.code(404);
      return {
        message: "Order not found"
      };
    }

    let tracking: Awaited<ReturnType<typeof refreshPacketaTracking>> | ReturnType<typeof getOrderTracking> =
      getOrderTracking(params.orderId);
    if (payload.provider === "packeta" && tracking) {
      tracking = await refreshPacketaTracking({
        orderId: params.orderId,
        trackingNumber: payload.trackingNumber
      });
      if (tracking) {
        applyOrderTrackingSnapshot(params.orderId, tracking);
      }
    }

    reply.code(201);
    return tracking ?? getOrderTracking(params.orderId);
  });

  app.post("/orders/:orderId/tracking/refresh", async (request, reply) => {
    const params = z.object({ orderId: z.string() }).parse(request.params);
    const tracking = getOrderTracking(params.orderId);

    if (!tracking) {
      reply.code(404);
      return {
        message: "Tracking not found"
      };
    }

    if (tracking.provider !== "packeta") {
      return tracking;
    }

    const refreshed = await refreshPacketaTracking({
      orderId: params.orderId,
      trackingNumber: tracking.trackingNumber
    });
    applyOrderTrackingSnapshot(params.orderId, refreshed);
    return refreshed;
  });

  app.post("/orders/:orderId/confirm-delivery", async (request, reply) => {
    const params = z.object({ orderId: z.string() }).parse(request.params);
    const updated = confirmOrderDelivery(params.orderId);

    if (!updated) {
      reply.code(404);
      return {
        message: "Order not found"
      };
    }

    return {
      orderId: params.orderId,
      status: "delivered",
      trackingStatus: updated.trackingStatus,
      trackingLastEvent: updated.trackingLastEvent,
      trackingLastEventAt: updated.trackingLastEventAt,
      sellerPayoutStatus: updated.sellerPayoutStatus
    };
  });
}
