import type { NextApiRequest, NextApiResponse } from "next";
import { AccessToken } from "livekit-server-sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { room, identity, canPublish } = req.query;

  if (!room || !identity) {
    return res.status(400).json({ error: "room and identity are required" });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit is not configured on the server" });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(identity),
  });

  // canPublish=true lets this participant send audio/video (broadcaster / voice
  // chat speaker). Everyone can always subscribe (listen/watch).
  at.addGrant({
    room: String(room),
    roomJoin: true,
    canPublish: canPublish === "true",
    canSubscribe: true,
  });

  const token = await at.toJwt();
  res.status(200).json({ token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL });
}
