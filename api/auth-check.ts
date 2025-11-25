import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateToken } from "./utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authEnabled = process.env.AUTH_ENABLED === "true";

    if (!authEnabled) {
      return res.status(200).json({
        authenticated: true,
        authEnabled: false,
        message: "Autenticação desabilitada",
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || req.cookies?.auth_token;

    if (!token) {
      return res.status(200).json({
        authenticated: false,
        authEnabled: true,
      });
    }

    const payload = validateToken(token);
    if (!payload) {
      return res.status(200).json({
        authenticated: false,
        authEnabled: true,
      });
    }

    return res.status(200).json({
      authenticated: true,
      authEnabled: true,
      username: payload.username,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(500).json({
      error: "Erro ao verificar autenticação",
      details: (error as Error).message,
    });
  }
}
