#!/usr/bin/env node

/**
 * Script to generate password hash for AUTH_USERS environment variable
 * 
 * Usage:
 *   node scripts/generate-password-hash.js <username> <password>
 * 
 * Example:
 *   node scripts/generate-password-hash.js admin mypassword123
 * 
 * Output format: username:salt:hash
 * Add to .env.vercel as: AUTH_USERS=username:salt:hash,username2:salt:hash
 */

import { createHash, randomBytes } from 'crypto';

function hashPassword(password, salt) {
  const useSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + useSalt)
    .digest('hex');
  return `${useSalt}:${hash}`;
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node generate-password-hash.js <username> <password>');
  console.error('Example: node generate-password-hash.js admin mypassword123');
  process.exit(1);
}

const [username, password] = args;
const hashedPassword = hashPassword(password);

console.log('\n=== Password Hash Generated ===\n');
console.log(`Username: ${username}`);
console.log(`Hashed Password: ${hashedPassword}`);
console.log('\n=== Add to .env.vercel ===\n');
console.log(`AUTH_ENABLED=true`);
console.log(`AUTH_USERS=${username}:${hashedPassword}`);
console.log('\n=== For multiple users ===\n');
console.log(`AUTH_USERS=user1:salt:hash,user2:salt:hash,...`);
console.log('\n==============================\n');
