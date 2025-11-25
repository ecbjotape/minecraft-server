import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { requireAuth } from "./utils/auth.js";
import { waitForSSMCommand, extractCommandOutput } from "./utils/ssm-helper.js";

async function whitelistHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, player } = req.body;

    if (
      !action ||
      !["add", "remove", "list", "enable", "disable"].includes(action)
    ) {
      return res.status(400).json({
        error: "Ação inválida. Use: add, remove, list, enable ou disable",
      });
    }

    if ((action === "add" || action === "remove") && !player) {
      return res.status(400).json({
        error: "Nome do jogador é obrigatório para add/remove",
      });
    }

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

    let command: string;
    switch (action) {
      case "add":
        command = `screen -S minecraft -p 0 -X stuff "whitelist add ${player}^M"`;
        break;
      case "remove":
        command = `screen -S minecraft -p 0 -X stuff "whitelist remove ${player}^M"`;
        break;
      case "list":
        command = `screen -S minecraft -p 0 -X stuff "whitelist list^M" && sleep 2 && tail -n 5 /home/ubuntu/minecraft-server/logs/latest.log`;
        break;
      case "enable":
        command = `screen -S minecraft -p 0 -X stuff "whitelist on^M"`;
        break;
      case "disable":
        command = `screen -S minecraft -p 0 -X stuff "whitelist off^M"`;
        break;
    }

    const ssmCommand = new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: "AWS-RunShellScript",
      Parameters: {
        commands: [command],
      },
    });

    const response = await ssmClient.send(ssmCommand);
    const commandId = response.Command?.CommandId;

    if (!commandId) {
      return res.status(500).json({ error: "Failed to get command ID" });
    }

    // Wait for command to complete and get output
    const result = await waitForSSMCommand(ssmClient, commandId, INSTANCE_ID);
    const output = result
      ? await extractCommandOutput(ssmClient, commandId, INSTANCE_ID)
      : "";

    return res.status(200).json({
      success: true,
      message: `Whitelist ${action} executado com sucesso`,
      commandId,
      action,
      player: player || null,
      output,
    });
  } catch (error) {
    console.error("Error managing whitelist:", error);
    return res.status(500).json({
      error: "Erro ao gerenciar whitelist",
      details: (error as Error).message,
    });
  }
}

export default requireAuth(whitelistHandler);
