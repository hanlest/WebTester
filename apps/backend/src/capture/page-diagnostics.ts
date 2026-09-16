import type { Page } from "playwright";

export interface ConsoleLogEntry {
  type: string;
  text: string;
  timestamp: number;
}

export interface NetworkErrorEntry {
  url: string;
  failure: string;
  timestamp: number;
}

export class PageDiagnostics {
  private consoleLogs: ConsoleLogEntry[] = [];
  private networkErrors: NetworkErrorEntry[] = [];
  private attached = false;

  attach(page: Page) {
    if (this.attached) return;
    this.attached = true;

    page.on("console", (msg) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
      if (this.consoleLogs.length > 500) {
        this.consoleLogs.shift();
      }
    });

    page.on("requestfailed", (request) => {
      this.networkErrors.push({
        url: request.url(),
        failure: request.failure()?.errorText || "unknown",
        timestamp: Date.now(),
      });
      if (this.networkErrors.length > 200) {
        this.networkErrors.shift();
      }
    });
  }

  getConsoleLogs(): ConsoleLogEntry[] {
    return [...this.consoleLogs];
  }

  getNetworkErrors(): NetworkErrorEntry[] {
    return [...this.networkErrors];
  }
}
