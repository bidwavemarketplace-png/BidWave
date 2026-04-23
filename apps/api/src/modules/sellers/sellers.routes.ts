import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createBuyNowOffer,
  createBuyNowListing,
  createSellerApplication,
  deleteBuyNowListing,
  getSellerDashboardSummary,
  listPushTokensForProfile,
  listBuyNowListings,
  listDirectMessages,
  listDirectMessageThreads,
  listSellerApplications,
  listSellerOrders,
  listSellerShows,
  registerPushToken,
  respondToBuyNowOffer,
  sendDirectMessage
} from "../../data/mock-store";

const applicationSchema = z.object({
  userId: z.string().min(3),
  storeName: z.string().min(2),
  legalName: z.string().min(2),
  countryCode: z.enum(["CZ", "SK"]),
  categoryFocus: z.string().min(2)
});

const createBuyNowSchema = z.object({
  sellerName: z.string().min(2),
  title: z.string().min(2),
  price: z.number().positive(),
  currency: z.enum(["EUR", "CZK"]).optional(),
  imageUrl: z.string().optional()
});

const createBuyNowOfferSchema = z.object({
  listingId: z.string().min(1),
  buyerId: z.string().min(1).optional(),
  buyerName: z.string().min(2),
  offerPrice: z.number().positive()
});

const respondBuyNowOfferSchema = z.object({
  sellerName: z.string().min(2),
  decision: z.enum(["approve", "reject"])
});

const directMessageQuerySchema = z.object({
  profileName: z.string().min(2),
  counterpartName: z.string().min(2).optional()
});

const directMessageSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  text: z.string().min(1)
});

const pushTokenSchema = z.object({
  profileName: z.string().min(2),
  pushToken: z.string().min(8)
});

export async function registerSellerRoutes(app: FastifyInstance) {
  const sendExpoPushNotification = async (input: {
    to: string[];
    title: string;
    body: string;
    data: Record<string, unknown>;
  }) => {
    if (input.to.length === 0) {
      return;
    }

    const messages = input.to.map((token) => ({
      to: token,
      title: input.title,
      body: input.body,
      sound: "default",
      data: input.data
    }));

    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(messages)
      });
    } catch (error) {
      app.log.warn({ error }, "Unable to dispatch Expo push notification");
    }
  };

  app.get("/seller-applications", async () => {
    return {
      items: listSellerApplications()
    };
  });

  app.post("/seller-applications", async (request, reply) => {
    const payload = applicationSchema.parse(request.body);
    const created = createSellerApplication(payload);

    reply.code(201);
    return created;
  });

  app.get("/sellers/:sellerId/dashboard", async (request) => {
    const params = z.object({ sellerId: z.string() }).parse(request.params);
    const summary = getSellerDashboardSummary(params.sellerId);
    const shows = listSellerShows(summary.sellerId);
    const orders = listSellerOrders(summary.storeName);

    return {
      summary,
      shows,
      orders
    };
  });

  app.get("/buy-now", async (request) => {
    const query = z.object({ sellerName: z.string().optional() }).parse(request.query);
    return {
      items: listBuyNowListings(query.sellerName)
    };
  });

  app.post("/buy-now", async (request, reply) => {
    const payload = createBuyNowSchema.parse(request.body);
    const created = createBuyNowListing(payload);
    reply.code(201);
    return created;
  });

  app.delete("/buy-now/:listingId", async (request, reply) => {
    const params = z.object({ listingId: z.string().min(1) }).parse(request.params);
    const removed = deleteBuyNowListing(params.listingId);
    if (!removed) {
      reply.code(404);
      return { message: "Listing not found" };
    }

    return removed;
  });

  app.post("/buy-now/offers", async (request, reply) => {
    const payload = createBuyNowOfferSchema.parse(request.body);
    const created = createBuyNowOffer(payload);
    if (!created) {
      reply.code(404);
      return { message: "Listing not found" };
    }

    if (created === null) {
      reply.code(400);
      return { message: "Offer must be greater than zero and cannot exceed the buy now price." };
    }

    const recipientTokens = listPushTokensForProfile(created.sellerName);
    await sendExpoPushNotification({
      to: recipientTokens,
      title: created.buyerName.trim(),
      body: `Offer for ${created.productTitle}: ${created.offerPrice.toFixed(2)} ${created.currency}`,
      data: {
        kind: "direct-message",
        counterpartName: created.buyerName.trim(),
        offerId: created.id
      }
    });

    reply.code(201);
    return created;
  });

  app.post("/buy-now/offers/:offerId/respond", async (request, reply) => {
    const params = z.object({ offerId: z.string().min(1) }).parse(request.params);
    const payload = respondBuyNowOfferSchema.parse(request.body);
    const updated = respondToBuyNowOffer({
      offerId: params.offerId,
      sellerName: payload.sellerName,
      decision: payload.decision
    });

    if (!updated) {
      reply.code(404);
      return { message: "Offer not found" };
    }

    if (updated === null) {
      reply.code(403);
      return { message: "Only the seller can respond to this offer." };
    }

    const recipientTokens = listPushTokensForProfile(updated.buyerName);
    await sendExpoPushNotification({
      to: recipientTokens,
      title: updated.sellerName,
      body:
        updated.status === "approved"
          ? `Offer approved for ${updated.productTitle}`
          : `Offer rejected for ${updated.productTitle}`,
      data: {
        kind: "direct-message",
        counterpartName: updated.sellerName,
        offerId: updated.id
      }
    });

    return updated;
  });

  app.get("/direct-messages", async (request) => {
    const query = directMessageQuerySchema.parse(request.query);
    if (query.counterpartName) {
      return {
        items: listDirectMessages(query.profileName, query.counterpartName)
      };
    }

    return {
      items: listDirectMessageThreads(query.profileName)
    };
  });

  app.post("/direct-messages", async (request, reply) => {
    const payload = directMessageSchema.parse(request.body);
    const created = sendDirectMessage(payload);

    const recipientTokens = listPushTokensForProfile(payload.to);
    await sendExpoPushNotification({
      to: recipientTokens,
      title: payload.from.trim(),
      body: payload.text.trim(),
      data: {
        kind: "direct-message",
        counterpartName: payload.from.trim()
      }
    });

    reply.code(201);
    return created;
  });

  app.post("/push-tokens", async (request, reply) => {
    const payload = pushTokenSchema.parse(request.body);
    const created = registerPushToken(payload);
    reply.code(201);
    return created;
  });
}
