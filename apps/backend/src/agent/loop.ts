import { Page } from "playwright";
import { AIProvider, AIMessage } from "../ai/index.js";
import { AGENT_TOOLS } from "./tools.js";
import { ToolExecutor } from "./executor.js";
import { TestResult, AgentLog } from "./types.js";

export class AgentLoop {
  private messages: AIMessage[] = [];
  private logs: AgentLog[] = [];
  private stopRequested = false;

  constructor(
    private aiProvider: AIProvider,
    private page: Page,
    private onLog?: (log: AgentLog) => void
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

    // Initial user message
    this.messages = [
      {
        role: "user",
        content: `You are an AI assistant testing a web application. The browser is already open and currently loaded at this exact URL:\n\n${currentUrl}\n\nDo NOT navigate to a different domain or URL unless the test case explicitly instructs you to, or it is a natural consequence of interacting with the page (e.g. clicking a link, submitting a form). Never guess or assume a different URL for "the application" - the page already loaded at ${currentUrl} IS the application under test.\n\nExecute the following test case:\n\n${testCase}\n\nUse the available tools to interact with and verify the application. When you are done, you MUST call the finishTest tool exactly once with your pass/fail verdict and reasoning - do not just write a text conclusion.\n\nIMPORTANT: Write the "reasoning" field of finishTest in Spanish (español). Any other free text you write should also be in Spanish.`,
      },
    ];

    let loopCount = 0;
    const maxLoops = 10;
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

      const executor = new ToolExecutor(this.page);
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
