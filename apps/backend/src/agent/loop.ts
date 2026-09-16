import { Page } from "playwright";
import { AIProvider, AIMessage } from "../ai/index.js";
import { AGENT_TOOLS } from "./tools.js";
import { ToolExecutor } from "./executor.js";
import type { ToolExecutorDeps } from "./tool-context.js";
import { TestResult, AgentLog } from "./types.js";

export class AgentLoop {
  private messages: AIMessage[] = [];
  private logs: AgentLog[] = [];
  private stopRequested = false;

  constructor(
    private aiProvider: AIProvider,
    private page: Page,
    private onLog?: (log: AgentLog) => void,
    private toolDeps?: ToolExecutorDeps
  ) {}

  stop() {
    this.stopRequested = true;
  }

  private log(level: AgentLog["level"], message: string, data?: unknown) {
    const entry: AgentLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    this.onLog?.(entry);
    console.log(`[Loop:${level}] ${message}`, data ? JSON.stringify(data) : "");
  }

  async executeTest(testCase: string): Promise<TestResult> {
    const startTime = Date.now();
    const testId = `test_${Date.now()}`;

    const currentUrl = this.page.url();
    this.log("info", `Starting test: ${testCase}`, { currentUrl });

    const agentGuidelines = `You are an AI assistant testing a web application. The browser is already open and currently loaded at this exact URL:

${currentUrl}

Do NOT navigate to a different domain or URL unless the test case explicitly instructs you to, or it is a natural consequence of interacting with the page (e.g. clicking a link, submitting a form). Never guess or assume a different URL for "the application" - the page already loaded at ${currentUrl} IS the application under test.

Execute the following test case:

${testCase}

Use the available tools to interact with and verify the application. Prefer getPageState after important actions (form submit, navigation) to inspect URL, visible dialogs/modals, errors, and whether login fields are still present. After submitting a login form, call wait (2000–4000 ms) before inspecting the page.

AUTHENTICATION / LOGIN:
- Do NOT fail login only because the URL did not become "/dashboard" or a specific path. SPAs often keep the same URL or use unexpected routes.
- Login likely succeeded if: login/password fields disappeared or are no longer visible; user menu, logout, or authenticated app chrome appeared; OR a modal/dialog opened that is clearly unrelated to credential errors (onboarding, notices, promotions). A post-login modal does NOT mean login failed.
- If a modal obscures the page after login, close it (click Cerrar/Close/X or pressKey Escape), then call getPageState again before your verdict.
- Fail login only with clear evidence: invalid-credentials messages, errors on the login form, or the login form still visible with no sign of an authenticated session.

If you discover a defect, call reportBug before finishTest. For data validation you may use queryDatabase (SELECT only) when the test case requires DB checks.

When you are done, you MUST call the finishTest tool exactly once with your pass/fail verdict and reasoning - do not just write a text conclusion.

IMPORTANT: Write the "reasoning" field of finishTest in Spanish (español). Any other free text you write should also be in Spanish.`;

    // Initial user message
    this.messages = [
      {
        role: "user",
        content: agentGuidelines,
      },
    ];

    let loopCount = 0;
    const maxLoops = 15;
    let finalResult: { passed: boolean; reasoning: string } | null = null;

    while (loopCount < maxLoops) {
      if (this.stopRequested) {
        this.log("warn", `Test stopped by user`);
        finalResult = { passed: false, reasoning: "Test detenido manualmente por el usuario." };
        break;
      }

      loopCount++;
      this.log("info", `Loop iteration ${loopCount}/${maxLoops}`);

      // Get response from AI
      const response = await this.aiProvider.chat(this.messages, AGENT_TOOLS);
      this.log("info", `AI response received`, { stopReason: response.stopReason, hasToolUse: !!response.toolUse });

      if (this.stopRequested) {
        this.log("warn", `Test stopped by user`);
        finalResult = { passed: false, reasoning: "Test detenido manualmente por el usuario." };
        break;
      }

      // Add assistant response to messages
      const assistantContent: Array<{ type: "text" | "tool_use"; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> = [];
      if (response.content) {
        assistantContent.push({ type: "text", text: response.content });
      }
      if (response.toolUse) {
        assistantContent.push({
          type: "tool_use",
          id: response.toolUse.id,
          name: response.toolUse.name,
          input: response.toolUse.input,
        });
      }

      this.messages.push({
        role: "assistant",
        content: assistantContent as any,
      });

      // If no tool use, we're done (agent stopped without calling finishTest)
      if (!response.toolUse || response.stopReason === "end_turn") {
        this.log("warn", `Agent stopped without calling finishTest`, { reason: response.stopReason });
        finalResult = { passed: false, reasoning: response.content || "Agent did not call finishTest before stopping." };
        break;
      }

      // finishTest is a terminal tool - handle it directly, don't run it through ToolExecutor
      if (response.toolUse.name === "finishTest") {
        const { passed, reasoning } = response.toolUse.input as { passed: boolean; reasoning: string };
        finalResult = { passed: !!passed, reasoning: reasoning || "No reasoning provided." };
        this.log("info", `finishTest called`, finalResult);
        break;
      }

      // Execute the tool
      this.log("info", `Executing tool: ${response.toolUse.name}`, response.toolUse.input);

      const executor = new ToolExecutor(this.page, this.toolDeps);
      const toolResult = await executor.execute(response.toolUse.name, response.toolUse.input);

      // Add logs from executor
      for (const log of executor.getLogs()) {
        this.onLog?.(log);
        this.logs.push(log);
      }

      if (this.stopRequested) {
        this.log("warn", `Test stopped by user`);
        finalResult = { passed: false, reasoning: "Test detenido manualmente por el usuario." };
        break;
      }

      // Add tool result to messages
      this.messages.push({
        role: "user",
        content: [
          {
            type: "tool_use",
            id: response.toolUse.id,
            name: response.toolUse.name,
            input: response.toolUse.input,
          },
          {
            type: "text",
            text: `Tool result:\n${JSON.stringify(toolResult)}`,
          },
        ],
      });

      if (!toolResult.success) {
        this.log("warn", `Tool execution failed: ${toolResult.error}`);
      }
    }

    const duration = Date.now() - startTime;

    if (!finalResult) {
      finalResult = { passed: false, reasoning: `Test did not conclude within ${maxLoops} loop iterations.` };
    }

    this.log("info", `Test result: ${finalResult.passed ? "PASSED" : "FAILED"}`, { duration, reasoning: finalResult.reasoning });

    return {
      testId,
      passed: finalResult.passed,
      reasoning: finalResult.reasoning,
      logs: this.logs,
      duration,
    };
  }
}
