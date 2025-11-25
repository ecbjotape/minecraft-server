import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";
import {
  waitForSSMCommand,
  extractCommandOutput,
} from "./utils/ssm-helper.js";

async function serverPropertiesHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { action } = req.method === "GET" ? req.query : req.body;

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
      return res.status(500).json({ error: "AWS credentials not configured" });
    }

    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    if (action === "load" || req.method === "GET") {
      // Load current server.properties
      const command = new SendCommandCommand({
        InstanceIds: [INSTANCE_ID],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
          commands: [
            `cd /home/ubuntu/minecraft-server && \
            if [ -f server.properties ]; then \
              cat server.properties; \
            else \
              echo "File not found"; \
            fi`,
          ],
        },
      });

      const response = await ssmClient.send(command);
      const commandId = response.Command?.CommandId;

      if (!commandId) {
        return res.status(500).json({ error: "Failed to get command ID" });
      }

      const result = await waitForSSMCommand(ssmClient, commandId, INSTANCE_ID);
      const output = result
        ? await extractCommandOutput(ssmClient, commandId, INSTANCE_ID)
        : "";

      // Parse server.properties into config object
      const config = parseServerProperties(output);

      return res.status(200).json({
        success: true,
        config,
        raw: output,
      });
    } else if (action === "save" && req.method === "POST") {
      // Save server.properties
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Config is required" });
      }

      // Generate server.properties content
      const properties = generateServerProperties(config);

      // Escape for shell
      const escapedProperties = properties.replace(/'/g, "'\\''");

      const command = new SendCommandCommand({
        InstanceIds: [INSTANCE_ID],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
          commands: [
            `cd /home/ubuntu/minecraft-server && \
            cp server.properties server.properties.backup.$(date +%Y%m%d_%H%M%S) && \
            echo '${escapedProperties}' > server.properties && \
            echo "Configuration saved successfully"`,
          ],
        },
      });

      const response = await ssmClient.send(command);
      const commandId = response.Command?.CommandId;

      if (!commandId) {
        return res.status(500).json({ error: "Failed to get command ID" });
      }

      const result = await waitForSSMCommand(ssmClient, commandId, INSTANCE_ID);
      const output = result
        ? await extractCommandOutput(ssmClient, commandId, INSTANCE_ID)
        : "";

      return res.status(200).json({
        success: true,
        message:
          "Configurações salvas com sucesso! Reinicie o servidor para aplicar as mudanças.",
        output,
      });
    } else if (action === "reset" && req.method === "POST") {
      // Reset to default server.properties
      const command = new SendCommandCommand({
        InstanceIds: [INSTANCE_ID],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
          commands: [
            `cd /home/ubuntu/minecraft-server && \
            if [ -f server.properties.default ]; then \
              cp server.properties.default server.properties; \
            else \
              rm -f server.properties; \
            fi && \
            echo "Configuration reset to defaults"`,
          ],
        },
      });

      const response = await ssmClient.send(command);
      const commandId = response.Command?.CommandId;

      if (!commandId) {
        return res.status(500).json({ error: "Failed to get command ID" });
      }

      await waitForSSMCommand(ssmClient, commandId, INSTANCE_ID);

      return res.status(200).json({
        success: true,
        message: "Configurações restauradas para o padrão!",
      });
    } else {
      return res.status(400).json({
        error: "Invalid action",
        availableActions: ["load", "save", "reset"],
      });
    }
  } catch (error) {
    console.error(`Error managing server config:`, error);
    return res.status(500).json({
      error: "Erro ao gerenciar configurações",
      details: (error as Error).message,
    });
  }
}

function parseServerProperties(content: string): any {
  const lines = content.split("\n");
  const config: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    // Map properties to frontend config
    switch (key.trim()) {
      case "motd":
        config.motd = value;
        break;
      case "max-players":
        config.maxPlayers = parseInt(value) || 20;
        break;
      case "difficulty":
        config.difficulty = value;
        break;
      case "gamemode":
        config.gamemode = value;
        break;
      case "view-distance":
        config.viewDistance = parseInt(value) || 10;
        break;
      case "simulation-distance":
        config.simulationDistance = parseInt(value) || 10;
        break;
      case "level-name":
        config.levelName = value;
        break;
      case "level-seed":
        config.levelSeed = value;
        break;
      case "level-type":
        config.levelType = value;
        break;
      case "generate-structures":
        config.generateStructures = value === "true";
        break;
      case "spawn-animals":
        config.spawnAnimals = value === "true";
        break;
      case "spawn-monsters":
        config.spawnMonsters = value === "true";
        break;
      case "spawn-npcs":
        config.spawnNpcs = value === "true";
        break;
      case "allow-nether":
        config.allowNether = value === "true";
        break;
      case "pvp":
        config.pvp = value === "true";
        break;
      case "hardcore":
        config.hardcore = value === "true";
        break;
      case "max-tick-time":
        config.maxTickTime = parseInt(value) || 60000;
        break;
      case "network-compression-threshold":
        config.networkCompression = parseInt(value) || 256;
        break;
      case "entity-broadcast-range-percentage":
        config.entityBroadcastRange = parseInt(value) || 100;
        break;
      case "online-mode":
        config.onlineMode = value === "true";
        break;
      case "enforce-whitelist":
        config.enforceWhitelist = value === "true";
        break;
      case "prevent-proxy-connections":
        config.preventProxyConnections = value === "true";
        break;
      case "spawn-protection":
        config.spawnProtection = parseInt(value) || 16;
        break;
      case "enable-command-block":
        config.enableCommandBlock = value === "true";
        break;
      case "enable-query":
        config.enableQuery = value === "true";
        break;
      case "enable-rcon":
        config.enableRcon = value === "true";
        break;
      case "announce-player-achievements":
        config.announcePlayerAchievements = value === "true";
        break;
      case "enable-status":
        config.enableStatus = value === "true";
        break;
      case "function-permission-level":
        config.functionPermissionLevel = parseInt(value) || 2;
        break;
      case "op-permission-level":
        config.opPermissionLevel = parseInt(value) || 4;
        break;
      case "player-idle-timeout":
        config.playerIdleTimeout = parseInt(value) || 0;
        break;
    }
  }

  return config;
}

function generateServerProperties(config: any): string {
  return `#Minecraft server properties
#Generated by Dashboard
motd=${config.motd || "A Minecraft Server"}
max-players=${config.maxPlayers || 20}
difficulty=${config.difficulty || "normal"}
gamemode=${config.gamemode || "survival"}
view-distance=${config.viewDistance || 10}
simulation-distance=${config.simulationDistance || 10}
level-name=${config.levelName || "world"}
level-seed=${config.levelSeed || ""}
level-type=${config.levelType || "minecraft:normal"}
generate-structures=${config.generateStructures !== false}
spawn-animals=${config.spawnAnimals !== false}
spawn-monsters=${config.spawnMonsters !== false}
spawn-npcs=${config.spawnNpcs !== false}
allow-nether=${config.allowNether !== false}
pvp=${config.pvp !== false}
hardcore=${config.hardcore || false}
max-tick-time=${config.maxTickTime || 60000}
network-compression-threshold=${config.networkCompression || 256}
entity-broadcast-range-percentage=${config.entityBroadcastRange || 100}
online-mode=${config.onlineMode !== false}
enforce-whitelist=${config.enforceWhitelist || false}
prevent-proxy-connections=${config.preventProxyConnections || false}
spawn-protection=${config.spawnProtection || 16}
enable-command-block=${config.enableCommandBlock || false}
enable-query=${config.enableQuery || false}
enable-rcon=${config.enableRcon || false}
announce-player-achievements=${
    config.announcePlayerAchievements !== false
  }
enable-status=${config.enableStatus !== false}
function-permission-level=${config.functionPermissionLevel || 2}
op-permission-level=${config.opPermissionLevel || 4}
player-idle-timeout=${config.playerIdleTimeout || 0}
`;
}

// Apply auth to POST operations only
export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    return requireAuth(serverPropertiesHandler)(req, res);
  }
  return serverPropertiesHandler(req, res);
}
