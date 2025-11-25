import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";

async function backupHandler(req: VercelRequest, res: VercelResponse) {
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

    // Script de backup
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
      TimeoutSeconds: 300, // 5 minutos
    });

    const response = await ssmClient.send(command);

    return res.status(200).json({
      success: true,
      message: "Backup iniciado com sucesso",
      commandId: response.Command?.CommandId,
      status: response.Command?.Status,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return res.status(500).json({
      error: "Erro ao criar backup",
      details: (error as Error).message,
    });
  }
}

export default requireAuth(backupHandler);
