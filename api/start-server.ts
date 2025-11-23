import type { VercelRequest, VercelResponse } from "@vercel/node";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, chmodSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { PEM_PATH, EIP, USER } = process.env;

    if (!PEM_PATH || !EIP || !USER) {
      return res
        .status(500)
        .json({ error: "Environment variables not configured" });
    }

    // Create temporary PEM file
    const pemContent = process.env.PEM_CONTENT;
    if (!pemContent) {
      return res.status(500).json({ error: "PEM_CONTENT not configured" });
    }

    const tempPemPath = join(tmpdir(), "minecraft-key.pem");
    writeFileSync(tempPemPath, pemContent.replace(/\\n/g, "\n"));
    chmodSync(tempPemPath, 0o400);

    // SSH command to start Minecraft server
    const sshCommand = `
      ssh -i ${tempPemPath} -o StrictHostKeyChecking=no ${USER}@${EIP} '
        cd ~/minecraft-server || exit 1
        if screen -list | grep -q "minecraft"; then
          echo "Server already running"
        else
          screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui
          echo "Server started"
        fi
      '
    `;

    const { stdout, stderr } = await execAsync(sshCommand);

    if (stderr && !stderr.includes("Warning")) {
      console.error("SSH Error:", stderr);
    }

    return res.status(200).json({
      success: true,
      message: "Minecraft server starting",
      output: stdout,
    });
  } catch (error) {
    console.error("Error starting server:", error);
    return res.status(500).json({
      error: "Failed to start Minecraft server",
      details: (error as Error).message,
    });
  }
}
