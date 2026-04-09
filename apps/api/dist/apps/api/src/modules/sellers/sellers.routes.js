"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSellerRoutes = registerSellerRoutes;
const zod_1 = require("zod");
const mock_store_1 = require("../../data/mock-store");
const applicationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(3),
    storeName: zod_1.z.string().min(2),
    legalName: zod_1.z.string().min(2),
    countryCode: zod_1.z.enum(["CZ", "SK"]),
    categoryFocus: zod_1.z.string().min(2)
});
async function registerSellerRoutes(app) {
    app.get("/seller-applications", async () => {
        return {
            items: (0, mock_store_1.listSellerApplications)()
        };
    });
    app.post("/seller-applications", async (request, reply) => {
        const payload = applicationSchema.parse(request.body);
        const created = (0, mock_store_1.createSellerApplication)(payload);
        reply.code(201);
        return created;
    });
    app.get("/sellers/:sellerId/dashboard", async (request) => {
        const params = zod_1.z.object({ sellerId: zod_1.z.string() }).parse(request.params);
        const summary = (0, mock_store_1.getSellerDashboardSummary)(params.sellerId);
        const shows = (0, mock_store_1.listSellerShows)(summary.sellerId);
        const orders = (0, mock_store_1.listSellerOrders)(summary.storeName);
        return {
            summary,
            shows,
            orders
        };
    });
}
