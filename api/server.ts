import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";
import {
  validateAWSConfig,
  createEC2Client,
  createSSMClient,
} from "./utils/aws-client.js";
import {
  parseSSMOutput,
  convertToServerInfo,
  createDefaultServerInfo,
} from "./utils/minecraft-parser.js";
import { waitForSSMCommand, extractCommandOutput } from "./utils/ssm-helper.js";

async function serverHandler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.method === "GET" ? req.query : req.body;

  if (!action) {
    return res.status(400).json({
      error: "Action is required",
      availableActions: ["start-ec2", "start-server", "stop-ec2", "restart", "status"],
    });
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

    switch (action) {
      case "start-ec2": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const command = new StartInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        });

        const response = await ec2Client.send(command);

        return res.status(200).json({
          success: true,
          message: "EC2 instance starting",
          data: response.StartingInstances,
        });
      }

      case "stop-ec2": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const command = new StopInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        });

        const response = await ec2Client.send(command);

        return res.status(200).json({
          success: true,
          message: "EC2 instance stopping",
          data: response.StoppingInstances,
        });
      }

      case "start-server": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        // First, check EC2 instance state
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
      }

      case "restart": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        // Check EC2 instance state
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

        if (state !== "running") {
          return res.status(409).json({
            error: `A instância precisa estar rodando. Estado atual: ${state}`,
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

        // Restart Minecraft server (kill screen session and start new one)
        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              "cd /home/ubuntu/minecraft-server && screen -S minecraft -X quit 2>/dev/null; sleep 2; screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui && echo 'Server restarted successfully'",
            ],
          },
        });

        const response = await ssmClient.send(command);

        return res.status(200).json({
          success: true,
          message: "Servidor Minecraft reiniciado com sucesso",
          commandId: response.Command?.CommandId,
          status: response.Command?.Status,
        });
      }

      case "status": {
        if (req.method !== "GET") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const awsConfig = validateAWSConfig();
        const ec2 = createEC2Client(awsConfig);

        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        });

        const ec2Response = await ec2.send(ec2Command);
        const instance = ec2Response.Reservations?.[0]?.Instances?.[0];

        if (!instance) {
          return res.status(404).json({
            error: "Instance not found",
            instanceId: INSTANCE_ID,
          });
        }

        const state = instance.State?.Name || "unknown";
        const publicIp = instance.PublicIpAddress || null;

        let serverInfo = createDefaultServerInfo();

        if (state === "running") {
          try {
            const ssmClient = createSSMClient(awsConfig);

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
              const result = await waitForSSMCommand(
                ssmClient,
                commandId,
                INSTANCE_ID
              );

              if (result) {
                const { output } = extractCommandOutput(result);
                const parsed = parseSSMOutput(output);
                serverInfo = convertToServerInfo(parsed);
              }
            }
          } catch (ssmError) {
            console.log("Could not check Minecraft status:", ssmError);
          }
        }

        return res.status(200).json({
          success: true,
          instanceId: INSTANCE_ID,
          ec2State: state,
          publicIp: publicIp,
          isRunning: state === "running",
          isStopped: state === "stopped",
          isPending: state === "pending",
          isStopping: state === "stopping",
          minecraftStatus: serverInfo.status,
          playersOnline: String(serverInfo.playersOnline),
          maxPlayers: String(serverInfo.maxPlayers),
          playerCount: `${serverInfo.playersOnline}/${serverInfo.maxPlayers}`,
          playerNames: serverInfo.playerNames,
          serverVersion: serverInfo.serverVersion,
        });
      }

      default:
        return res.status(400).json({
          error: "Invalid action",
          availableActions: ["start-ec2", "start-server", "stop-ec2", "restart", "status"],
        });
    }
  } catch (error) {
    console.error(`Error executing ${action}:`, error);
    const err = error as any;

    let userMessage = `Failed to execute ${action}`;
    let statusCode = 500;

    if (err.Code === "IncorrectInstanceState") {
      userMessage =
        "A instância já está ligada ou está em transição. Aguarde alguns segundos e tente novamente.";
      statusCode = 409;
    }

    if (
      err.__type === "InvalidInstanceId" ||
      err.code === "InvalidInstanceId"
    ) {
      userMessage =
        "A instância EC2 ainda não está pronta para receber comandos. Aguarde mais alguns segundos e tente novamente.";
      statusCode = 503;
    }

    return res.status(statusCode).json({
      error: userMessage,
      details: err.message || String(error),
      errorName: err.name || err.__type,
      errorCode: err.code || err.__type,
    });
  }
}

// Only apply auth for POST methods (write operations)
export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    return requireAuth(serverHandler)(req, res);
  }
  return serverHandler(req, res);
}
