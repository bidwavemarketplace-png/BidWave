import Fastify from "fastify";
import { AppError } from "./lib/errors";
import { registerAuctionRoutes } from "./modules/auctions/auctions.routes";
import { registerAuthRoutes } from "./modules/auth/auth.routes";
import { registerBuyerRoutes } from "./modules/buyer/buyer.routes";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerOrderRoutes } from "./modules/orders/orders.routes";
import { registerSellerRoutes } from "./modules/sellers/sellers.routes";
import { registerShowRoutes } from "./modules/shows/shows.routes";
import { registerStreamingRoutes } from "./modules/streaming/streaming.routes";

export function buildServer() {
  const app = Fastify({
    logger: true
  });

  app.setErrorHandler((error, _request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(error instanceof Error ? error.message : "Internal server error", 500);

    reply.status(appError.statusCode).send({
      error: appError.name,
      message: appError.message
    });
  });

  app.register(registerHealthRoutes);
  app.register(registerAuthRoutes);
  app.register(registerBuyerRoutes);
  app.register(registerOrderRoutes);
  app.register(registerSellerRoutes);
  app.register(registerShowRoutes);
  app.register(registerAuctionRoutes);
  app.register(registerStreamingRoutes);

  return app;
}
