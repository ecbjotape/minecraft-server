import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";
import { waitForSSMCommand, extractCommandOutput } from "./utils/ssm-helper.js";

async function logsHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lines = "50" } = req.query;
    const lineCount = parseInt(lines as string) || 50;

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
      return res.status(500).json({ error: "AWS credentials not configured" });
    }

    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: "AWS-RunShellScript",
      Parameters: {
        commands: [
          `tail -n ${lineCount} /home/ubuntu/minecraft-server/logs/latest.log 2>/dev/null || echo "Log file not found"`,
        ],
      },
    });

    const response = await ssmClient.send(command);
    const commandId = response.Command?.CommandId;

    if (!commandId) {
      return res.status(500).json({ error: "Failed to get command ID" });
    }

    // Wait for command to complete
    await waitForSSMCommand(ssmClient, commandId, INSTANCE_ID);
    const output = await extractCommandOutput(
      ssmClient,
      commandId,
      INSTANCE_ID
    );

    return res.status(200).json({
      success: true,
      logs: output.split("\n"),
      lineCount: output.split("\n").length,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({
      error: "Erro ao buscar logs",
      details: (error as Error).message,
    });
  }
}

export default requireAuth(logsHandler);
