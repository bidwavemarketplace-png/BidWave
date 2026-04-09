"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShowRoutes = registerShowRoutes;
const zod_1 = require("zod");
const mock_store_1 = require("../../data/mock-store");
const createShowSchema = zod_1.z.object({
    title: zod_1.z.string().min(4),
    description: zod_1.z.string().min(10),
    scheduledFor: zod_1.z.string().datetime(),
    category: zod_1.z.string().min(2),
    sellerId: zod_1.z.string().min(3),
    sellerName: zod_1.z.string().min(2)
});
async function registerShowRoutes(app) {
    app.get("/shows", async (request) => {
        const query = zod_1.z
            .object({
            status: zod_1.z.string().optional(),
            category: zod_1.z.string().optional(),
            country: zod_1.z.string().optional(),
            sellerId: zod_1.z.string().optional()
        })
            .parse(request.query);
        const sellerFiltered = query.sellerId
            ? (0, mock_store_1.listSellerShows)(query.sellerId)
            : mock_store_1.mockShows;
        const statusFiltered = query.status
            ? sellerFiltered.filter((item) => item.status === query.status)
            : sellerFiltered;
        return {
            filters: query,
            items: statusFiltered
        };
    });
    app.post("/shows", async (request, reply) => {
        const payload = createShowSchema.parse(request.body);
        const created = (0, mock_store_1.createShow)({
            title: payload.title,
            sellerId: payload.sellerId,
            sellerName: payload.sellerName,
            scheduledFor: payload.scheduledFor
        });
        reply.code(201);
        return {
            ...created,
            description: payload.description,
            category: payload.category
        };
    });
    app.get("/shows/:showId", async (request) => {
        const params = zod_1.z.object({ showId: zod_1.z.string() }).parse(request.params);
        const show = (0, mock_store_1.getShowDetail)(params.showId);
        return show ?? {
            id: params.showId,
            title: "Placeholder show detail",
            status: "scheduled",
            description: "Show detail missing from mock data.",
            viewers: 0,
            coverImage: "",
            streamRoomId: "room_placeholder",
            seller: {
                id: "seller_placeholder",
                storeName: "BidWave Pilot Seller"
            },
            items: []
        };
    });
    app.post("/shows/:showId/go-live", async (request) => {
        const params = zod_1.z.object({ showId: zod_1.z.string() }).parse(request.params);
        return {
            id: params.showId,
            status: "live",
            streamRoomId: "room_placeholder"
        };
    });
}
