import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, randomBytes } from "crypto";

interface User {
  username: string;
  passwordHash: string;
}

interface Session {
  token: string;
  username: string;
  expiresAt: number;
}

// In-memory session storage (for serverless, use short-lived sessions)
const sessions = new Map<string, Session>();

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

// Generate session token
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Get users from environment (format: USERNAME:SALT:HASH,USERNAME2:SALT:HASH)
export function getUsers(): User[] {
  const usersEnv = process.env.AUTH_USERS || "";
  if (!usersEnv) return [];

  return usersEnv.split(",").map((userStr) => {
    // Split only at first colon to get username, rest is salt:hash
    const firstColonIndex = userStr.indexOf(":");
    if (firstColonIndex === -1) return { username: "", passwordHash: "" };
    
    const username = userStr.substring(0, firstColonIndex);
    const passwordHash = userStr.substring(firstColonIndex + 1); // salt:hash
    return { username, passwordHash };
  });
}

// Create session
export function createSession(username: string): string {
  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  sessions.set(token, { token, username, expiresAt });

  // Clean expired sessions
  cleanExpiredSessions();

  return token;
}

// Validate session
export function validateSession(token: string): boolean {
  const session = sessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }

  return true;
}

// Clean expired sessions
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
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

    if (!token || !validateSession(token)) {
      return res.status(401).json({
        error: "Não autorizado. Faça login para continuar.",
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
    return createSession(username);
  }

  return null;
}
