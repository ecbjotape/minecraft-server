import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";
import {
  waitForSSMCommand,
  extractCommandOutput,
} from "./utils/ssm-helper.js";

async function securityHandler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.method === "GET" ? req.query : req.body;

  if (!action) {
    return res.status(400).json({
      error: "Action is required",
      availableActions: [
        "whitelist-add",
        "whitelist-remove",
        "whitelist-list",
        "whitelist-enable",
        "whitelist-disable",
        "backup",
        "logs",
      ],
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
      return res.status(500).json({ error: "AWS credentials not configured" });
    }

    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    switch (action) {
      case "whitelist-add": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { player } = req.body;
        if (!player) {
          return res.status(400).json({
            error: "Nome do jogador é obrigatório",
          });
        }

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              `screen -S minecraft -p 0 -X stuff "whitelist add ${player}^M"`,
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
          message: `Jogador ${player} adicionado à whitelist`,
          commandId,
          output,
        });
      }

      case "whitelist-remove": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { player } = req.body;
        if (!player) {
          return res.status(400).json({
            error: "Nome do jogador é obrigatório",
          });
        }

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              `screen -S minecraft -p 0 -X stuff "whitelist remove ${player}^M"`,
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
          message: `Jogador ${player} removido da whitelist`,
          commandId,
          output,
        });
      }

      case "whitelist-list": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [
              `screen -S minecraft -p 0 -X stuff "whitelist list^M" && sleep 2 && tail -n 5 /home/ubuntu/minecraft-server/logs/latest.log`,
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
          message: "Lista de whitelist obtida",
          commandId,
          output,
        });
      }

      case "whitelist-enable": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [`screen -S minecraft -p 0 -X stuff "whitelist on^M"`],
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
          message: "Whitelist ativada",
          commandId,
          output,
        });
      }

      case "whitelist-disable": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [`screen -S minecraft -p 0 -X stuff "whitelist off^M"`],
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
          message: "Whitelist desativada",
          commandId,
          output,
        });
      }

      case "backup": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const backupScript = `
          cd /home/ubuntu/minecraft-server && \
          BACKUP_DIR="/home/ubuntu/backups" && \
          DATE=$(date +%Y%m%d_%H%M%S) && \
          BACKUP_NAME="minecraft_backup_\${DATE}.tar.gz" && \
          mkdir -p "\$BACKUP_DIR" && \
          if screen -list | grep -q 'minecraft'; then \
            screen -S minecraft -p 0 -X stuff "say §eBackup iniciando...^M" && \
            screen -S minecraft -p 0 -X stuff "save-off^M" && \
            screen -S minecraft -p 0 -X stuff "save-all^M" && \
            sleep 5; \
          fi && \
          tar -czf "\$BACKUP_DIR/\$BACKUP_NAME" --exclude='logs' --exclude='crash-reports' --exclude='cache' . && \
          if screen -list | grep -q 'minecraft'; then \
            screen -S minecraft -p 0 -X stuff "save-on^M" && \
            screen -S minecraft -p 0 -X stuff "say §aBackup concluído!^M"; \
          fi && \
          ls -t "\$BACKUP_DIR"/minecraft_backup_*.tar.gz | tail -n +8 | xargs -r rm && \
          echo "Backup criado: \$BACKUP_NAME" && \
          ls -lh "\$BACKUP_DIR" | tail -5
        `;

        const command = new SendCommandCommand({
          InstanceIds: [INSTANCE_ID],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [backupScript],
          },
          TimeoutSeconds: 300,
        });

        const response = await ssmClient.send(command);

        return res.status(200).json({
          success: true,
          message: "Backup iniciado com sucesso",
          commandId: response.Command?.CommandId,
          status: response.Command?.Status,
        });
      }

      case "logs": {
        if (req.method !== "GET") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { lines = "50" } = req.query;
        const lineCount = parseInt(lines as string) || 50;

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
      }

      default:
        return res.status(400).json({
          error: "Invalid action",
          availableActions: [
            "whitelist-add",
            "whitelist-remove",
            "whitelist-list",
            "whitelist-enable",
            "whitelist-disable",
            "backup",
            "logs",
          ],
        });
    }
  } catch (error) {
    console.error(`Error executing security action ${action}:`, error);
    return res.status(500).json({
      error: `Erro ao executar ${action}`,
      details: (error as Error).message,
    });
  }
}

// Apply auth to all operations
export default requireAuth(securityHandler);
