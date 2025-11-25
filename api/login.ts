import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateUser } from "./utils/auth.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Erro ao fazer login",
      details: (error as Error).message,
    });
  }
}
