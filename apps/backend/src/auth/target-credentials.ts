import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { decryptJson, encryptJson } from "../crypto/secrets.js";

export interface StoredCredentials {
  username: string;
  password: string;
}

export class TargetCredentialsService {
  constructor(private secretsDir: string) {
    mkdirSync(this.secretsDir, { recursive: true });
  }

  private credPath(targetAppId: string) {
    return join(this.secretsDir, `credentials_${targetAppId}.enc`);
  }

  private storagePath(targetAppId: string) {
    return join(this.secretsDir, `storage_${targetAppId}.json`);
  }

  saveCredentials(targetAppId: string, creds: StoredCredentials) {
    const blob = encryptJson(this.secretsDir, creds);
    writeFileSync(this.credPath(targetAppId), blob, "utf8");
  }

  getCredentials(targetAppId: string): StoredCredentials | null {
    const path = this.credPath(targetAppId);
    if (!existsSync(path)) return null;
    return decryptJson<StoredCredentials>(this.secretsDir, readFileSync(path, "utf8"));
  }

  saveStorageState(targetAppId: string, state: object) {
    writeFileSync(this.storagePath(targetAppId), JSON.stringify(state, null, 2), "utf8");
  }

  getStorageStatePath(targetAppId: string): string | null {
    const path = this.storagePath(targetAppId);
    return existsSync(path) ? path : null;
  }
}
