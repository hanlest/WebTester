import type { Page } from "playwright";
import type { PageDiagnostics } from "../capture/page-diagnostics.js";
import type { ReportService } from "../reports/service.js";
import type { BugSeverity } from "@web-tester/shared";
import { appStore } from "../persistence/store.js";
import { postgresReadOnly } from "../db/postgres.js";

export interface ToolExecutorDeps {
  sessionId: string;
  runId?: string;
  page: Page;
  diagnostics: PageDiagnostics;
  reportService: ReportService;
}

export async function reportBug(deps: ToolExecutorDeps, input: Record<string, unknown>) {
  const title = String(input.title || "Bug sin título");
  const description = String(input.description || "");
  const severity = (input.severity as BugSeverity) || "medium";
  const steps = Array.isArray(input.steps) ? input.steps.map(String) : undefined;

  const summary = await deps.reportService.createFromPage(deps.page, deps.diagnostics, {
    title,
    description,
    severity,
    steps,
    sessionId: deps.sessionId,
    runId: deps.runId,
  });

  appStore.indexBug(summary.id, deps.runId ?? null, summary.severity, summary.title, summary.createdAt);

  return {
    success: true,
    data: {
      bugId: summary.id,
      severity: summary.severity,
      message: "Bug report saved to reports/",
    },
  };
}

export async function queryDatabase(_deps: ToolExecutorDeps, input: Record<string, unknown>) {
  const sql = String(input.sql || "");
  const result = await postgresReadOnly.query(sql);
  return { success: true, data: result };
}
