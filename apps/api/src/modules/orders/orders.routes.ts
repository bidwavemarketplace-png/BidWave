import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getOrderDetail, listBuyerOrders } from "../../data/mock-store";

export async function registerOrderRoutes(app: FastifyInstance) {
  app.get("/orders", async (request) => {
    const query = z
      .object({
        userId: z.string().optional(),
        sellerName: z.string().optional()
      })
      .parse(request.query);

    return {
      items: listBuyerOrders(query.userId, query.sellerName)
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
}
