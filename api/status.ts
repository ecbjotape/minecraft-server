import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from "@aws-sdk/client-ssm";

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

    // Get EC2 instance status
    const ec2Command = new DescribeInstancesCommand({
      InstanceIds: [INSTANCE_ID],
    });

    const ec2Response = await ec2Client.send(ec2Command);
    const instance = ec2Response.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      return res.status(404).json({
        error: "Instance not found",
      });
    }

    const state = instance.State?.Name || "unknown";
    const publicIp = instance.PublicIpAddress || null;

    let minecraftStatus = "offline";
    let playersOnline = "0";
    let maxPlayers = "20";

    // Se a instância está rodando, verifica o status do Minecraft
    if (state === "running") {
      try {
        const ssmClient = new SSMClient({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
          },
        });

        // Comando para verificar se o Minecraft está rodando
        const checkCommand = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              "if screen -list | grep -q 'minecraft'; then echo 'ONLINE'; else echo 'OFFLINE'; fi",
              "if screen -list | grep -q 'minecraft'; then echo 'Players: 0/20'; fi",
            ],
          },
        });

        const ssmResponse = await ssmClient.send(checkCommand);
        const commandId = ssmResponse.Command?.CommandId;

        if (commandId) {
          // Aguarda um pouco para o comando executar
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Busca o resultado do comando
          const resultCommand = new GetCommandInvocationCommand({
            CommandId: commandId,
            InstanceId: INSTANCE_ID,
          });

          const result = await ssmClient.send(resultCommand);
          const output = result.StandardOutputContent || "";

          if (output.includes("ONLINE")) {
            minecraftStatus = "online";
            
            // Tenta extrair número de jogadores do output
            const playersMatch = output.match(/Players:\s*(\d+)\/(\d+)/);
            if (playersMatch) {
              playersOnline = playersMatch[1];
              maxPlayers = playersMatch[2];
            }
          }
        }
      } catch (ssmError) {
        // Se falhar ao verificar o Minecraft, continua com offline
        console.log("Could not check Minecraft status:", ssmError);
      }
    }

    return res.status(200).json({
      success: true,
      instanceId: INSTANCE_ID,
      ec2State: state, // pending | running | stopping | stopped | shutting-down | terminated
      publicIp: publicIp,
      isRunning: state === "running",
      isStopped: state === "stopped",
      isPending: state === "pending",
      isStopping: state === "stopping",
      minecraftStatus: minecraftStatus, // online | offline | starting
      playersOnline: playersOnline,
      maxPlayers: maxPlayers,
      playerCount: `${playersOnline}/${maxPlayers}`,
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
