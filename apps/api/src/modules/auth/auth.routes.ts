import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  deleteUserProfile,
  getUserProfile,
  reserveUsernameForProfile,
  saveUserProfile
} from "../../data/mock-store";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const reserveUsernameSchema = z.object({
  uid: z.string().min(1),
  username: z.string().min(3),
  previousUsername: z.string().optional()
});

const userProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(3),
  fullName: z.string(),
  dateOfBirth: z.string(),
  addressLine1: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  phone: z.string(),
  updatedAt: z.string(),
  usernameChangedAt: z.string().optional(),
  preferredLocale: z.enum(["en", "sk", "cs"]).optional(),
  preferredCurrency: z.enum(["EUR", "CZK"]).optional(),
  onboardingCompleted: z.boolean().optional(),
  profileImageUrl: z.string().optional()
});

export async function registerAuthRoutes(app: FastifyInstance) {
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

  app.post("/profiles/reserve-username", async (request, reply) => {
    try {
      const payload = reserveUsernameSchema.parse(request.body);
      const username = reserveUsernameForProfile(payload);
      return { username };
    } catch (error) {
      reply.code(409);
      return {
        message: error instanceof Error ? error.message : "Unable to reserve username"
      };
    }
  });

  app.get("/profiles/:uid", async (request, reply) => {
    const params = z.object({ uid: z.string().min(1) }).parse(request.params);
    const profile = getUserProfile(params.uid);
    if (!profile) {
      reply.code(404);
      return { message: "Profile not found" };
    }

    return profile;
  });

  app.put("/profiles/:uid", async (request, reply) => {
    const params = z.object({ uid: z.string().min(1) }).parse(request.params);
    const payload = userProfileSchema.parse(request.body);

    if (params.uid !== payload.uid) {
      reply.code(400);
      return { message: "Profile uid mismatch" };
    }

    try {
      reserveUsernameForProfile({
        uid: payload.uid,
        username: payload.username
      });
    } catch (error) {
      reply.code(409);
      return {
        message: error instanceof Error ? error.message : "Username already exists."
      };
    }

    return saveUserProfile(payload);
  });

  app.delete("/profiles/:uid", async (request, reply) => {
    const params = z.object({ uid: z.string().min(1) }).parse(request.params);
    const removed = deleteUserProfile(params.uid);
    if (!removed) {
      reply.code(404);
      return { message: "Profile not found" };
    }

    return removed;
  });
}
