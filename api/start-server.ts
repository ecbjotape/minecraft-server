import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";

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

    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Command to start Minecraft server
    const command = new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: "AWS-RunShellScript",
      Parameters: {
        commands: [
          "cd ~/minecraft-server || exit 1",
          "if screen -list | grep -q 'minecraft'; then",
          "  echo 'Server already running'",
          "else",
          "  screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui",
          "  echo 'Server started successfully'",
          "fi",
        ],
      },
    });

    const response = await ssmClient.send(command);

    return res.status(200).json({
      success: true,
      message: "Minecraft server start command sent",
      commandId: response.Command?.CommandId,
      status: response.Command?.Status,
    });
  } catch (error) {
    console.error("Error starting server:", error);
    const err = error as any;
    return res.status(500).json({
      error: "Failed to start Minecraft server",
      details: err.message || String(error),
      errorName: err.name,
      errorCode: err.code,
    });
  }
}
