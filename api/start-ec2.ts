import type { VercelRequest, VercelResponse } from "@vercel/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const instanceId = process.env.INSTANCE_ID;

    if (!instanceId) {
      return res.status(500).json({ error: "INSTANCE_ID not configured" });
    }

    // Execute AWS CLI command
    const { stdout, stderr } = await execAsync(
      `aws ec2 start-instances --instance-ids ${instanceId}`
    );

    if (stderr) {
      console.error("AWS CLI Error:", stderr);
    }

    return res.status(200).json({
      success: true,
      message: "EC2 instance starting",
      output: stdout,
    });
  } catch (error) {
    console.error("Error starting EC2:", error);
    return res.status(500).json({
      error: "Failed to start EC2 instance",
      details: (error as Error).message,
    });
  }
}
