import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from "@aws-sdk/client-ssm";

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
  let playerNames: string[] = [];
  let serverVersion = "Unknown";    // Se a instância está rodando, verifica o status do Minecraft
    if (state === "running") {
      try {
        const ssmClient = new SSMClient({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
          },
        });

        // Comando simplificado para verificar o Minecraft
        const checkCommand = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              "screen -list | grep -q 'minecraft' && echo 'STATUS:ONLINE' || echo 'STATUS:OFFLINE'",
              "pgrep -f 'minecraft_server.jar' > /dev/null && echo 'PROCESS:RUNNING'",
              "screen -S minecraft -X stuff 'list\\n' 2>/dev/null; sleep 1",
              "tail -n 20 /home/ubuntu/minecraft-server/logs/latest.log 2>/dev/null | grep -oE 'There are [0-9]+ of a max of [0-9]+' | tail -1 | sed -E 's/There are ([0-9]+) of a max of ([0-9]+)/PLAYERS:\\1\\/\\2/' || echo 'PLAYERS:0/20'",
              "tail -n 20 /home/ubuntu/minecraft-server/logs/latest.log 2>/dev/null | grep -oP 'There are [0-9]+ of a max of [0-9]+ players online: \\K.*' | tail -1 | sed 's/^/PLAYERNAMES:/' || echo 'PLAYERNAMES:'",
              "grep -m 1 'Starting minecraft server version' /home/ubuntu/minecraft-server/logs/latest.log 2>/dev/null | sed -E 's/.*version ([0-9.]+).*/VERSION:\\1/' || echo 'VERSION:Unknown'",
            ],
          },
        });

        const ssmResponse = await ssmClient.send(checkCommand);
        const commandId = ssmResponse.Command?.CommandId;

        if (commandId) {
          // Aguarda mais tempo para garantir que o comando executou (aumentado para 5 segundos)
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Tenta buscar o resultado com retry (até 5 tentativas)
          let attempts = 0;
          let result = null;

          while (attempts < 5) {
            try {
              const resultCommand = new GetCommandInvocationCommand({
                CommandId: commandId,
                InstanceId: INSTANCE_ID,
              });

              result = await ssmClient.send(resultCommand);

              console.log(
                `Attempt ${attempts + 1} - SSM Status:`,
                result.Status
              );

              if (result.Status === "Success" || result.Status === "Failed") {
                break;
              }

              // Se ainda está em execução, aguarda mais um pouco
              if (
                result.Status === "InProgress" ||
                result.Status === "Pending"
              ) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                attempts++;
              } else {
                break;
              }
            } catch (err: any) {
              console.log(`Attempt ${attempts + 1} failed:`, err.message);
              attempts++;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          if (result) {
            const output = result.StandardOutputContent || "";
            const errorOutput = result.StandardErrorContent || "";
            console.log("SSM Output:", output);
            if (errorOutput) console.log("SSM Error:", errorOutput);

            if (
              output.includes("STATUS:ONLINE") ||
              output.includes("PROCESS:RUNNING")
            ) {
              minecraftStatus = "online";

              // Tenta extrair número de jogadores
              const playersMatch = output.match(/PLAYERS:(\d+)\/(\d+)/);
              if (playersMatch) {
                playersOnline = playersMatch[1];
                maxPlayers = playersMatch[2];
              }

              // Extrai nomes dos jogadores
              const namesMatch = output.match(/PLAYERNAMES:(.*)/);
              if (namesMatch && namesMatch[1].trim()) {
                playerNames = namesMatch[1]
                  .split(",")
                  .map((name) => name.trim())
                  .filter((name) => name.length > 0);
              }

              // Extrai versão do servidor
              const versionMatch = output.match(/VERSION:(.*)/);
              if (versionMatch && versionMatch[1].trim()) {
                serverVersion = versionMatch[1].trim();
              }
            }
          } else {
            console.log("SSM command did not complete in time");
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
      playerNames: playerNames,
      serverVersion: serverVersion,
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
