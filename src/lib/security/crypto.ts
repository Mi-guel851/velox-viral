/**
 * OAuth token encryption at rest.
 *
 * Tokens are encrypted with AES-256-GCM in the application layer, not with
 * pgcrypto, so the key never lives in the database. A database dump alone is
 * therefore useless for impersonating a user's social accounts.
 *
 * Format: `v1.<iv-b64>.<authTag-b64>.<ciphertext-b64>`
 * The version prefix lets a future key rotation or algorithm change decrypt old
 * values rather than orphaning them.
 */
import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getEncryptionKey } from "@/lib/env.server";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, the recommended size for GCM
const VERSION = "v1";

export class EncryptionNotConfiguredError extends Error {
  constructor() {
    super(
      "TOKEN_ENCRYPTION_KEY is not configured. Social account connections are disabled because tokens cannot be stored securely."
    );
    this.name = "EncryptionNotConfiguredError";
  }
}

/** Encrypts a token. Throws when no key is configured — never falls back to plaintext. */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) throw new EncryptionNotConfiguredError();

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

/**
 * Decrypts a token produced by `encryptToken`.
 *
 * GCM authenticates the ciphertext, so tampering or a wrong key surfaces as a
 * thrown error rather than garbage plaintext.
 */
export function decryptToken(payload: string): string {
  const key = getEncryptionKey();
  if (!key) throw new EncryptionNotConfiguredError();

  const parts = payload.split(".");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted token payload.");
  }

  const [version, ivB64, tagB64, dataB64] = parts;
  if (version !== VERSION) {
    throw new Error(`Unsupported token encryption version: ${version}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Decrypts, returning null instead of throwing. For read paths that can degrade. */
export function tryDecryptToken(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decryptToken(payload);
  } catch {
    return null;
  }
}

/**
 * Constant-time secret comparison for cron/webhook auth, so an attacker cannot
 * discover a secret byte-by-byte from response timing.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
