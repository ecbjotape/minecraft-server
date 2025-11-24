import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EC2Client, StartInstancesCommand } from "@aws-sdk/client-ec2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      INSTANCE_ID,
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = process.env;

    console.log("Environment check:", {
      hasInstanceId: !!INSTANCE_ID,
      hasRegion: !!AWS_REGION,
      hasAccessKey: !!AWS_ACCESS_KEY_ID,
      hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
    });

    if (
      !INSTANCE_ID ||
      !AWS_REGION ||
      !AWS_ACCESS_KEY_ID ||
      !AWS_SECRET_ACCESS_KEY
    ) {
      return res.status(500).json({
        error: "AWS credentials not configured",
        missing: {
          instanceId: !INSTANCE_ID,
          region: !AWS_REGION,
          accessKey: !AWS_ACCESS_KEY_ID,
          secretKey: !AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    const ec2Client = new EC2Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new StartInstancesCommand({
      InstanceIds: [INSTANCE_ID],
    });

    const response = await ec2Client.send(command);

    return res.status(200).json({
      success: true,
      message: "EC2 instance starting",
      data: response.StartingInstances,
    });
  } catch (error) {
    console.error("Error starting EC2:", error);
    const err = error as any;

    // Treat instance state errors with friendly messages
    let userMessage = "Failed to start EC2 instance";
    let statusCode = 500;

    if (err.Code === "IncorrectInstanceState") {
      userMessage = "A instância já está ligada ou está em transição. Aguarde alguns segundos e tente novamente.";
      statusCode = 409; // Conflict
    }

    return res.status(statusCode).json({
      error: userMessage,
      details: err.message || String(error),
      errorName: err.name,
      errorCode: err.Code || err.code,
    });
  }
}
