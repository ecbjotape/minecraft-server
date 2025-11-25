import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, randomBytes, createHmac } from "crypto";

interface User {
  username: string;
  passwordHash: string;
}

interface TokenPayload {
  username: string;
  expiresAt: number;
}

// Hash password with salt
export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt || randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + useSalt)
    .digest("hex");
  return `${useSalt}:${hash}`;
}

// Verify password
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return hash === testHash;
}

// Get JWT secret from environment
function getJWTSecret(): string {
  return (
    process.env.JWT_SECRET || "minecraft-server-default-secret-change-this"
  );
}

// Create JWT token (simple implementation)
export function createToken(username: string): string {
  const payload: TokenPayload = {
    username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", getJWTSecret())
    .update(payloadBase64)
    .digest("base64");

  return `${payloadBase64}.${signature}`;
}

// Validate JWT token
export function validateToken(token: string): TokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split(".");

    // Verify signature
    const expectedSignature = createHmac("sha256", getJWTSecret())
      .update(payloadBase64)
      .digest("base64");

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64").toString()
    );

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// Get users from environment (format: USERNAME:SALT:HASH,USERNAME2:SALT:HASH)
export function getUsers(): User[] {
  const usersEnv = process.env.AUTH_USERS || "";
  if (!usersEnv) return [];

  return usersEnv.split(",").map((userStr: string) => {
    // Split only at first colon to get username, rest is salt:hash
    const firstColonIndex = userStr.indexOf(":");
    if (firstColonIndex === -1) return { username: "", passwordHash: "" };

    const username = userStr.substring(0, firstColonIndex);
    const passwordHash = userStr.substring(firstColonIndex + 1); // salt:hash
    return { username, passwordHash };
  });
}

// Middleware to verify authentication
export function requireAuth(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Check if authentication is enabled
    const authEnabled = process.env.AUTH_ENABLED === "true";
    if (!authEnabled) {
      return handler(req, res);
    }

    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        error: "Não autorizado. Faça login para continuar.",
        requiresAuth: true,
      });
    }

    const payload = validateToken(token);
    if (!payload) {
      return res.status(401).json({
        error: "Token inválido ou expirado. Faça login novamente.",
        requiresAuth: true,
      });
    }

    return handler(req, res);
  };
}

// Authenticate user
export function authenticateUser(
  username: string,
  password: string
): string | null {
  const users = getUsers();
  const user = users.find((u) => u.username === username);

  if (!user) return null;

  if (verifyPassword(password, user.passwordHash)) {
    return createToken(username);
  }

  return null;
}
