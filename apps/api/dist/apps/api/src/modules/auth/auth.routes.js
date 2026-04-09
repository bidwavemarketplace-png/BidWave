"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(2)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
async function registerAuthRoutes(app) {
    app.post("/auth/register", async (request, reply) => {
        const payload = registerSchema.parse(request.body);
        reply.code(201);
        return {
            message: "Registration scaffold ready for provider integration.",
            user: {
                id: "usr_placeholder",
                email: payload.email,
                displayName: payload.displayName
            }
        };
    });
    app.post("/auth/login", async (request) => {
        const payload = loginSchema.parse(request.body);
        return {
            message: "Login scaffold ready for session integration.",
            user: {
                id: "usr_placeholder",
                email: payload.email
            },
            token: "replace-with-real-session-token"
        };
    });
}
