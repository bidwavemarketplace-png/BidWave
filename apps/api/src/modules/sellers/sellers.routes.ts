import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createSellerApplication,
  getSellerDashboardSummary,
  listSellerApplications,
  listSellerOrders,
  listSellerShows
} from "../../data/mock-store";

const applicationSchema = z.object({
  userId: z.string().min(3),
  storeName: z.string().min(2),
  legalName: z.string().min(2),
  countryCode: z.enum(["CZ", "SK"]),
  categoryFocus: z.string().min(2)
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
}
