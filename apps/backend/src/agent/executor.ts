import { Page } from "playwright";
import { ToolResult, AgentLog } from "./types.js";
import type { ToolExecutorDeps } from "./tool-context.js";
import { queryDatabase, reportBug } from "./tool-context.js";

export class ToolExecutor {
  private logs: AgentLog[] = [];

  constructor(
    private page: Page,
    private deps?: ToolExecutorDeps
  ) {}

  getLogs(): AgentLog[] {
    return this.logs;
  }

  private log(level: AgentLog["level"], message: string, data?: unknown) {
    const entry: AgentLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    console.log(`[Agent:${level}] ${message}`, data ? JSON.stringify(data) : "");
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult> {
    this.log("info", `Executing tool: ${toolName}`, input);

    try {
      switch (toolName) {
        case "navigate":
          return await this.navigate(input.url as string);
        case "click":
          return await this.click(input.selector as string);
        case "fill":
          return await this.fill(input.selector as string, input.text as string);
        case "screenshot":
          return await this.screenshot();
        case "getPageState":
          return await this.getPageState();
        case "wait":
          return await this.wait(input.ms as number);
        case "pressKey":
          return await this.pressKey(input.key as string);
        case "getAccessibilityTree":
          return await this.getAccessibilityTree();
        case "evaluateJS":
          return await this.evaluateJS(input.code as string);
        case "waitForElement":
          return await this.waitForElement(input.selector as string, input.timeout as number | undefined);
        case "goBack":
          return await this.goBack();
        case "goForward":
          return await this.goForward();
        case "reportBug":
          if (!this.deps) return { success: false, error: "reportBug not available" };
          return await reportBug(this.deps, input);
        case "queryDatabase":
          if (!this.deps) return { success: false, error: "queryDatabase not available" };
          return await queryDatabase(this.deps, input);
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log("error", `Tool failed: ${toolName}`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  private async navigate(url: string): Promise<ToolResult> {
    this.log("info", `Navigating to ${url}`);
    try {
      await this.page.goto(url, { waitUntil: "load", timeout: 30000 });
      this.log("info", `Navigation successful`);
      return { success: true, data: { url, title: await this.page.title() } };
    } catch (error) {
      throw new Error(`Navigation failed: ${error}`);
    }
  }

  private async click(selector: string): Promise<ToolResult> {
    this.log("info", `Clicking element: ${selector}`);
    try {
      await this.page.click(selector);
      await this.page.waitForTimeout(400);
      this.log("info", `Click successful`);
      return { success: true, data: { url: this.page.url() } };
    } catch (error) {
      throw new Error(`Click failed on ${selector}: ${error}`);
    }
  }

  private async fill(selector: string, text: string): Promise<ToolResult> {
    this.log("info", `Filling element: ${selector} with text`);
    try {
      await this.page.fill(selector, text);
      this.log("info", `Fill successful`);
      return { success: true };
    } catch (error) {
      throw new Error(`Fill failed on ${selector}: ${error}`);
    }
  }

  private async screenshot(): Promise<ToolResult> {
    this.log("info", `Taking screenshot`);
    try {
      await this.page.screenshot({ type: "png" });
      this.log("info", `Screenshot taken`);
      return {
        success: true,
        data: {
          url: this.page.url(),
          title: await this.page.title(),
          note: "Screenshot saved for the session. Use getPageState or getAccessibilityTree to inspect the UI.",
        },
      };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error}`);
    }
  }

  private async getPageState(): Promise<ToolResult> {
    this.log("info", `Getting page state`);
    try {
      const code = `
        (function () {
          function isVisible(el) {
            if (!el || el.nodeType !== 1) return false;
            var style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
            var rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }
          function shortText(el, max) {
            return (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, max);
          }
          var loginSelectors = 'input[type="password"], input[type="email"], input[autocomplete="username"], input[autocomplete="current-password"]';
          var loginFields = Array.prototype.slice.call(document.querySelectorAll(loginSelectors)).filter(isVisible);
          var dialogNodes = Array.prototype.slice.call(
            document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog[open]')
          ).filter(isVisible);
          var dialogs = dialogNodes.map(function (el) {
            return { role: el.getAttribute("role"), ariaLabel: el.getAttribute("aria-label"), text: shortText(el, 400) };
          });
          var errorNodes = Array.prototype.slice.call(
            document.querySelectorAll('[role="alert"], [aria-live="assertive"], .error, [class*="error" i]')
          ).filter(isVisible);
          var errors = errorNodes.map(function (el) { return shortText(el, 200); }).filter(Boolean);
          return {
            url: location.href,
            pathname: location.pathname,
            title: document.title,
            visibleLoginFieldCount: loginFields.length,
            visibleDialogCount: dialogs.length,
            dialogs: dialogs,
            alertsAndErrors: errors.slice(0, 10),
            bodyTextSnippet: shortText(document.body, 1500),
          };
        })()
      `;
      const state = await this.page.evaluate(code);
      this.log("info", `Page state retrieved`);
      return { success: true, data: state };
    } catch (error) {
      throw new Error(`getPageState failed: ${error}`);
    }
  }

  private async wait(ms: number): Promise<ToolResult> {
    const duration = Math.min(Math.max(ms || 0, 0), 15000);
    this.log("info", `Waiting ${duration}ms`);
    await this.page.waitForTimeout(duration);
    return { success: true, data: { waitedMs: duration, url: this.page.url() } };
  }

  private async pressKey(key: string): Promise<ToolResult> {
    this.log("info", `Pressing key: ${key}`);
    try {
      await this.page.keyboard.press(key);
      await this.page.waitForTimeout(300);
      return { success: true, data: { key, url: this.page.url() } };
    } catch (error) {
      throw new Error(`pressKey failed: ${error}`);
    }
  }

  private async getAccessibilityTree(): Promise<ToolResult> {
    this.log("info", `Getting accessibility tree`);
    try {
      // Passed as a raw string (not a compiled function) to avoid esbuild/tsx
      // injecting a __name() helper call that doesn't exist in the browser context.
      const code = `
        (function () {
          function getRole(el) {
            return el.getAttribute("role") || el.tagName.toLowerCase();
          }
          function getText(el) {
            return (el.textContent || "").slice(0, 100).trim();
          }
          function traverse(el, depth) {
            if (depth > 10) return "";
            var indent = "  ".repeat(depth);
            var role = getRole(el);
            var text = getText(el);
            var info = text ? role + ' "' + text + '"' : role;
            var result = indent + info + "\\n";
            for (var i = 0; i < el.children.length; i++) {
              result += traverse(el.children[i], depth + 1);
            }
            return result;
          }
          return traverse(document.body, 0);
        })()
      `;

      const tree = await this.page.evaluate(code);

      this.log("info", `Accessibility tree retrieved`);
      return { success: true, data: { tree } };
    } catch (error) {
      throw new Error(`getAccessibilityTree failed: ${error}`);
    }
  }

  private async evaluateJS(code: string): Promise<ToolResult> {
    this.log("info", `Evaluating JavaScript`);
    try {
      const result = await this.page.evaluate((c) => eval(c), code);
      this.log("info", `Evaluation successful`);
      return { success: true, data: result };
    } catch (error) {
      throw new Error(`Evaluation failed: ${error}`);
    }
  }

  private async waitForElement(selector: string, timeout = 5000): Promise<ToolResult> {
    this.log("info", `Waiting for element: ${selector}`);
    try {
      await this.page.waitForSelector(selector, { timeout });
      this.log("info", `Element appeared`);
      return { success: true };
    } catch (error) {
      throw new Error(`Element not found after ${timeout}ms: ${selector}`);
    }
  }

  private async goBack(): Promise<ToolResult> {
    this.log("info", `Going back`);
    try {
      await this.page.goBack();
      this.log("info", `Navigation successful`);
      return { success: true };
    } catch (error) {
      throw new Error(`goBack failed: ${error}`);
    }
  }

  private async goForward(): Promise<ToolResult> {
    this.log("info", `Going forward`);
    try {
      await this.page.goForward();
      this.log("info", `Navigation successful`);
      return { success: true };
    } catch (error) {
      throw new Error(`goForward failed: ${error}`);
    }
  }
}
