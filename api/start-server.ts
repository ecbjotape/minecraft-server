import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

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

    // First, check EC2 instance state
    const ec2Client = new EC2Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const ec2Command = new DescribeInstancesCommand({
      InstanceIds: [INSTANCE_ID],
    });

    const ec2Response = await ec2Client.send(ec2Command);
    const instance = ec2Response.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      return res.status(404).json({
        error: "Instância EC2 não encontrada",
      });
    }

    const state = instance.State?.Name;

    // Check if instance is in a valid state for SSM
    if (state !== "running") {
      return res.status(409).json({
        error: `A instância precisa estar rodando. Estado atual: ${state}. Aguarde a EC2 iniciar completamente.`,
        currentState: state,
      });
    }

    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Command to start Minecraft server - simplified to single line
    const command = new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: "AWS-RunShellScript",
      Parameters: {
        commands: [
          "cd /home/ubuntu/minecraft-server && (screen -list | grep -q 'minecraft' && echo 'Server already running' || (screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui && echo 'Server started successfully'))",
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

    // Handle specific SSM errors
    let userMessage = "Falha ao iniciar servidor Minecraft";
    let statusCode = 500;

    if (
      err.__type === "InvalidInstanceId" ||
      err.code === "InvalidInstanceId"
    ) {
      userMessage =
        "A instância EC2 ainda não está pronta para receber comandos. Aguarde mais alguns segundos e tente novamente.";
      statusCode = 503; // Service Unavailable
    }

    return res.status(statusCode).json({
      error: userMessage,
      details: err.message || String(error),
      errorName: err.name || err.__type,
      errorCode: err.code || err.__type,
    });
  }
}
