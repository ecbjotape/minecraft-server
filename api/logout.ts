import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Clear the auth cookie
    res.setHeader(
      "Set-Cookie",
      `auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    );

    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      error: "Erro ao fazer logout",
      details: (error as Error).message,
    });
  }
}
