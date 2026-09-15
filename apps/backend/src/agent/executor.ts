import { Page } from "playwright";
import { ToolResult, AgentLog } from "./types.js";

export class ToolExecutor {
  private logs: AgentLog[] = [];
  private startTime = Date.now();

  constructor(private page: Page) {}

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
      this.log("info", `Click successful`);
      return { success: true };
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
      const buffer = await this.page.screenshot({ type: "png" });
      const base64 = buffer.toString("base64");
      this.log("info", `Screenshot taken`);
      return { success: true, data: { imageBase64: base64 } };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error}`);
    }
  }

  private async getAccessibilityTree(): Promise<ToolResult> {
    this.log("info", `Getting accessibility tree`);
    try {
      const tree = await this.page.evaluate(() => {
        const getRole = (el: Element): string => el.getAttribute("role") || el.tagName.toLowerCase();
        const getText = (el: Element): string => (el.textContent || "").slice(0, 100).trim();

        const traverse = (el: Element, depth = 0): string => {
          if (depth > 10) return "";
          const indent = "  ".repeat(depth);
          const role = getRole(el);
          const text = getText(el);
          const info = text ? `${role} "${text}"` : role;

          let result = `${indent}${info}\n`;
          for (const child of el.children) {
            result += traverse(child, depth + 1);
          }
          return result;
        };

        return traverse(document.body);
      });

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
