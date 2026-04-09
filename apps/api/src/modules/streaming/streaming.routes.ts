import { FastifyInstance } from "fastify";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";

import { config } from "../../config";

const credentialsQuerySchema = z.object({
  showId: z.string().min(3)
});

function resolveServerUrl(hostHeader: string | undefined) {
  if (config.LIVEKIT_WS_URL) {
    return config.LIVEKIT_WS_URL;
  }

  const host = hostHeader?.split(":")[0] ?? "127.0.0.1";
  return `ws://${host}:7880`;
}

async function createToken(params: {
  identity: string;
  roomName: string;
  name: string;
  canPublish: boolean;
  canSubscribe: boolean;
}) {
  const token = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
    identity: params.identity,
    name: params.name,
    ttl: "6h"
  });

  token.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: params.canPublish,
    canSubscribe: params.canSubscribe,
    canPublishData: true
  });

  return token.toJwt();
}

export async function registerStreamingRoutes(app: FastifyInstance) {
  app.get("/streaming/dev-credentials", async (request) => {
    const query = credentialsQuerySchema.parse(request.query);
    const roomName = `bidwave-${query.showId}`;
    const serverUrl = resolveServerUrl(request.headers.host);
    const issuedAt = Date.now();

    const hostToken = await createToken({
      identity: `host-${query.showId}-${issuedAt}`,
      roomName,
      name: `Host ${query.showId}`,
      canPublish: true,
      canSubscribe: true
    });

    const viewerToken = await createToken({
      identity: `viewer-${query.showId}-${issuedAt}`,
      roomName,
      name: `Viewer ${query.showId}`,
      canPublish: false,
      canSubscribe: true
    });

    return {
      roomName,
      serverUrl,
      hostToken,
      viewerToken
    };
  });
}
