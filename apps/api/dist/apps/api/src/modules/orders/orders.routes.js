"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOrderRoutes = registerOrderRoutes;
const zod_1 = require("zod");
const mock_store_1 = require("../../data/mock-store");
async function registerOrderRoutes(app) {
    app.get("/orders", async () => {
        return {
            items: (0, mock_store_1.listBuyerOrders)()
        };
    });
    app.get("/orders/:orderId", async (request, reply) => {
        const params = zod_1.z.object({ orderId: zod_1.z.string() }).parse(request.params);
        const order = (0, mock_store_1.getOrderDetail)(params.orderId);
        if (!order) {
            reply.code(404);
            return {
                message: "Order not found"
            };
        }
        return order;
    });
}
