import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      INSTANCE_ID,
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = process.env;

    if (
      !INSTANCE_ID ||
      !AWS_REGION ||
      !AWS_ACCESS_KEY_ID ||
      !AWS_SECRET_ACCESS_KEY
    ) {
      return res.status(500).json({
        error: "AWS credentials not configured",
      });
    }

    const ec2Client = new EC2Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new DescribeInstancesCommand({
      InstanceIds: [INSTANCE_ID],
    });

    const response = await ec2Client.send(command);
    const instance = response.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      return res.status(404).json({
        error: "Instance not found",
      });
    }

    const state = instance.State?.Name || "unknown";
    const publicIp = instance.PublicIpAddress || null;

    return res.status(200).json({
      success: true,
      instanceId: INSTANCE_ID,
      state: state, // pending | running | stopping | stopped | shutting-down | terminated
      publicIp: publicIp,
      isRunning: state === "running",
      isStopped: state === "stopped",
      isPending: state === "pending",
      isStopping: state === "stopping",
    });
  } catch (error) {
    console.error("Error getting instance status:", error);
    const err = error as any;
    return res.status(500).json({
      error: "Failed to get instance status",
      details: err.message || String(error),
    });
  }
}
