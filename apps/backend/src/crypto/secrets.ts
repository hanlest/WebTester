import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ALGO = "aes-256-gcm";

function getKey(secretsDir: string): Buffer {
  const envKey = process.env.SECRETS_KEY;
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  const keyPath = join(secretsDir, ".master-key");
  if (existsSync(keyPath)) {
    return Buffer.from(readFileSync(keyPath, "utf8").trim(), "hex");
  }

  mkdirSync(secretsDir, { recursive: true });
  const key = randomBytes(32);
  writeFileSync(keyPath, key.toString("hex"), "utf8");
  return key;
}

function deriveKey(master: Buffer, salt: Buffer): Buffer {
  return scryptSync(master, salt, 32);
}

export function encryptJson(secretsDir: string, payload: unknown): string {
  const master = getKey(secretsDir);
  const salt = randomBytes(16);
  const key = deriveKey(master, salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  });
}

export function decryptJson<T>(secretsDir: string, blob: string): T {
  const master = getKey(secretsDir);
  const parsed = JSON.parse(blob) as { salt: string; iv: string; tag: string; data: string };
  const key = deriveKey(master, Buffer.from(parsed.salt, "hex"));
  const decipher = createDecipheriv(ALGO, key, Buffer.from(parsed.iv, "hex"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(parsed.data, "hex")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
