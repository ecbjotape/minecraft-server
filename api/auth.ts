import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateUser, validateToken } from "./utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.method === "GET" ? req.query : req.body;

  if (!action) {
    return res.status(400).json({
      error: "Action is required",
      availableActions: ["login", "logout", "check"],
    });
  }

  try {
    switch (action) {
      case "login": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            error: "Usuário e senha são obrigatórios",
          });
        }

        const token = authenticateUser(username, password);

        if (!token) {
          return res.status(401).json({
            error: "Usuário ou senha inválidos",
          });
        }

        // Set cookie with token
        res.setHeader(
          "Set-Cookie",
          `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
        );

        return res.status(200).json({
          success: true,
          message: "Login realizado com sucesso",
          token,
          username,
        });
      }

      case "logout": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        // Clear the auth cookie
        res.setHeader(
          "Set-Cookie",
          `auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
        );

        return res.status(200).json({
          success: true,
          message: "Logout realizado com sucesso",
        });
      }

      case "check": {
        if (req.method !== "GET") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const authEnabled = process.env.AUTH_ENABLED === "true";

        if (!authEnabled) {
          return res.status(200).json({
            authenticated: true,
            authEnabled: false,
            message: "Autenticação desabilitada",
          });
        }

        const authHeader = req.headers.authorization;
        const token =
          authHeader?.replace("Bearer ", "") || req.cookies?.auth_token;

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
      }

      default:
        return res.status(400).json({
          error: "Invalid action",
          availableActions: ["login", "logout", "check"],
        });
    }
  } catch (error) {
    console.error(`Auth ${action} error:`, error);
    return res.status(500).json({
      error: `Erro ao executar ${action}`,
      details: (error as Error).message,
    });
  }
}
