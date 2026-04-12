import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createBuyNowListing,
  createSellerApplication,
  deleteBuyNowListing,
  getSellerDashboardSummary,
  listBuyNowListings,
  listDirectMessages,
  listDirectMessageThreads,
  listSellerApplications,
  listSellerOrders,
  listSellerShows,
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

const directMessageQuerySchema = z.object({
  profileName: z.string().min(2),
  counterpartName: z.string().min(2).optional()
});

const directMessageSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  text: z.string().min(1)
});

export async function registerSellerRoutes(app: FastifyInstance) {
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
    reply.code(201);
    return created;
  });
}
