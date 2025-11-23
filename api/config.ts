import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Retorna apenas informações não-sensíveis
    const config = {
      serverIP: process.env.EIP || "N/A",
      instanceId: process.env.INSTANCE_ID
        ? `${process.env.INSTANCE_ID.substring(0, 10)}...`
        : "N/A",
      region: process.env.AWS_REGION || "us-east-1",
    };

    return res.status(200).json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    return res.status(500).json({
      error: "Failed to fetch config",
      details: (error as Error).message,
    });
  }
}
