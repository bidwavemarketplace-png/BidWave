"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const errors_1 = require("./lib/errors");
const auctions_routes_1 = require("./modules/auctions/auctions.routes");
const auth_routes_1 = require("./modules/auth/auth.routes");
const health_routes_1 = require("./modules/health/health.routes");
const orders_routes_1 = require("./modules/orders/orders.routes");
const sellers_routes_1 = require("./modules/sellers/sellers.routes");
const shows_routes_1 = require("./modules/shows/shows.routes");
function buildServer() {
    const app = (0, fastify_1.default)({
        logger: true
    });
    app.setErrorHandler((error, _request, reply) => {
        const appError = error instanceof errors_1.AppError
            ? error
            : new errors_1.AppError(error instanceof Error ? error.message : "Internal server error", 500);
        reply.status(appError.statusCode).send({
            error: appError.name,
            message: appError.message
        });
    });
    app.register(health_routes_1.registerHealthRoutes);
    app.register(auth_routes_1.registerAuthRoutes);
    app.register(orders_routes_1.registerOrderRoutes);
    app.register(sellers_routes_1.registerSellerRoutes);
    app.register(shows_routes_1.registerShowRoutes);
    app.register(auctions_routes_1.registerAuctionRoutes);
    return app;
}
