import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { SendCommandCommand } from "@aws-sdk/client-ssm";
import {
  validateAWSConfig,
  createEC2Client,
  createSSMClient,
} from "./utils/aws-client";
import {
  parseSSMOutput,
  convertToServerInfo,
  createDefaultServerInfo,
} from "./utils/minecraft-parser";
import {
  waitForSSMCommand,
  extractCommandOutput,
} from "./utils/ssm-helper";

// Edge cases documented:
// 1. Missing environment variables
// 2. EC2 instance not found
// 3. EC2 instance in transitional state (pending, stopping)
// 4. SSM command timeout
// 5. Minecraft server crashed but EC2 running
// 6. Player count/names mismatch
// 7. Network errors during AWS API calls

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const INSTANCE_ID = process.env.INSTANCE_ID;

    if (!INSTANCE_ID) {
      return res.status(500).json({
        error: "Instance ID not configured",
      });
    }

    // Validate AWS credentials (throws if missing)
    const awsConfig = validateAWSConfig();
    const ec2Client = createEC2Client(awsConfig);

    // Get EC2 instance status
    const ec2Command = new DescribeInstancesCommand({
      InstanceIds: [INSTANCE_ID],
    });

    const ec2Response = await ec2Client.send(ec2Command);
    const instance = ec2Response.Reservations?.[0]?.Instances?.[0];

    // Edge case: Instance not found in AWS
    if (!instance) {
      return res.status(404).json({
        error: "Instance not found",
        instanceId: INSTANCE_ID,
      });
    }

    const state = instance.State?.Name || "unknown";
    const publicIp = instance.PublicIpAddress || null;

    // Default to offline state
    let serverInfo = createDefaultServerInfo();

    // Only check Minecraft if EC2 is running
    // Edge case: Don't waste resources checking stopped/stopping instances
    if (state === "running") {
      try {
        const ssmClient = createSSMClient(awsConfig);

        // SSM commands to check Minecraft server status
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

        // Edge case: No command ID returned
        if (!commandId) {
          console.log("No command ID received from SSM");
        } else {
          // Wait for command to complete with retry logic
          const result = await waitForSSMCommand(
            ssmClient,
            commandId,
            INSTANCE_ID
          );

          if (result) {
            const { output, error } = extractCommandOutput(result);
            console.log("SSM Output:", output);
            console.log("SSM Output length:", output.length);
            if (error) console.log("SSM Error:", error);

            // Parse the output
            const parsed = parseSSMOutput(output);
            console.log("Parsed SSM:", JSON.stringify(parsed, null, 2));

            // Convert to server info
            serverInfo = convertToServerInfo(parsed);
          }
        }
      } catch (ssmError) {
        // Edge case: SSM fails (network, permissions, etc.)
        // Continue with offline status
        console.log("Could not check Minecraft status:", ssmError);
      }
    }

    // Return comprehensive status
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
  } catch (error) {
    console.error("Error getting instance status:", error);
    const err = error as any;
    
    // Edge case: Return detailed error for debugging
    return res.status(500).json({
      error: "Failed to get instance status",
      details: err.message || String(error),
      errorName: err.name,
      errorCode: err.code,
    });
  }
}
