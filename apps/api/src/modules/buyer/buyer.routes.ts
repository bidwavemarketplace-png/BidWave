import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getBuyerBidReadiness, saveBuyerBidReadiness } from "../../data/mock-store";

const bidReadinessQuerySchema = z.object({
  userId: z.string().min(3)
});

const bidReadinessBodySchema = z.object({
  userId: z.string().min(3),
  address: z.object({
    fullName: z.string().min(2),
    dateOfBirth: z.string().min(8),
    line1: z.string().min(3),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    countryCode: z.string().min(2),
    phone: z.string().optional()
  }),
  defaultShippingMethodId: z.string().min(2),
  paymentMethodToken: z.string().min(4),
  acceptsInstantLotCharges: z.boolean(),
  acceptsGroupedShippingCharges: z.boolean(),
  shippingProvider: z.enum(["packeta", "balikovna"]).optional(),
  pickupPointId: z.string().optional(),
  pickupPointLabel: z.string().optional(),
  shippingPrice: z.number().nonnegative().optional()
});

export async function registerBuyerRoutes(app: FastifyInstance) {
  app.get("/buyer/bid-readiness", async (request) => {
    const query = bidReadinessQuerySchema.parse(request.query);
    return getBuyerBidReadiness(query.userId);
  });

  app.post("/buyer/bid-readiness", async (request, reply) => {
    const payload = bidReadinessBodySchema.parse(request.body);
    const saved = saveBuyerBidReadiness(payload);
    reply.code(201);
    return saved;
  });
}
