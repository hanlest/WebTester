import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { ReportService } from "./reports/service.js";
import { TargetCredentialsService } from "./auth/target-credentials.js";
import { appStore } from "./persistence/store.js";
import { postgresReadOnly } from "./db/postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const rootDir = join(__dirname, "../../..");

export const reportService = new ReportService(join(rootDir, "reports"));
export const credentialsService = new TargetCredentialsService(join(rootDir, ".secrets"));
export { appStore, postgresReadOnly };

if (process.env.DATABASE_URL) {
  postgresReadOnly.configure(process.env.DATABASE_URL);
}
