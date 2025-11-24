export interface MinecraftServerInfo {
  status: "online" | "offline" | "starting";
  playersOnline: number;
  maxPlayers: number;
  playerNames: string[];
  serverVersion: string;
}

export interface SSMCommandOutput {
  status: string;
  hasProcess: boolean;
  playersCount?: { online: number; max: number };
  playerNames?: string[];
  serverVersion?: string;
}

/**
 * Parse SSM command output to extract Minecraft server information
 * Edge cases handled:
 * - Empty output
 * - Partial output (some commands failed)
 * - Multiple players with commas
 * - Special characters in player names
 * - Missing version information
 */
export function parseSSMOutput(output: string): SSMCommandOutput {
  const result: SSMCommandOutput = {
    status: "offline",
    hasProcess: false,
  };

  if (!output || output.trim().length === 0) {
    return result;
  }

  // Check if server is online
  if (output.includes("STATUS:ONLINE") || output.includes("PROCESS:RUNNING")) {
    result.status = "online";
    result.hasProcess = output.includes("PROCESS:RUNNING");
  }

  // Extract player count
  const playersMatch = output.match(/PLAYERS:(\d+)\/(\d+)/);
  if (playersMatch) {
    result.playersCount = {
      online: parseInt(playersMatch[1], 10),
      max: parseInt(playersMatch[2], 10),
    };
  }

  // Extract player names
  const namesMatch = output.match(/PLAYERNAMES:([^\n\r]*)/);
  if (namesMatch && namesMatch[1].trim()) {
    result.playerNames = namesMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && name.length <= 16); // Minecraft usernames max 16 chars
  }

  // Extract server version
  const versionMatch = output.match(/VERSION:([^\n\r]+)/);
  if (versionMatch && versionMatch[1].trim() !== "Unknown") {
    result.serverVersion = versionMatch[1].trim();
  }

  return result;
}

/**
 * Validate player count consistency
 * Edge case: Player names count doesn't match player count number
 */
export function validatePlayerCount(
  playersOnline: number,
  playerNames: string[]
): boolean {
  return playersOnline === playerNames.length;
}

/**
 * Create default Minecraft server info for offline state
 */
export function createDefaultServerInfo(): MinecraftServerInfo {
  return {
    status: "offline",
    playersOnline: 0,
    maxPlayers: 20,
    playerNames: [],
    serverVersion: "Unknown",
  };
}

/**
 * Convert parsed SSM output to MinecraftServerInfo
 */
export function convertToServerInfo(
  parsed: SSMCommandOutput
): MinecraftServerInfo {
  const info = createDefaultServerInfo();

  if (parsed.status === "online") {
    info.status = "online";
  }

  if (parsed.playersCount) {
    info.playersOnline = parsed.playersCount.online;
    info.maxPlayers = parsed.playersCount.max;
  }

  if (parsed.playerNames && parsed.playerNames.length > 0) {
    info.playerNames = parsed.playerNames;

    // Edge case: If player names don't match count, log warning and use names length
    if (!validatePlayerCount(info.playersOnline, info.playerNames)) {
      console.warn(
        `Player count mismatch: count=${info.playersOnline}, names=${info.playerNames.length}`
      );
      info.playersOnline = info.playerNames.length;
    }
  }

  if (parsed.serverVersion) {
    info.serverVersion = parsed.serverVersion;
  }

  return info;
}
