import { Page } from "playwright";
import { AIProvider, AIMessage } from "../ai/index.js";
import { AGENT_TOOLS } from "./tools.js";
import { ToolExecutor } from "./executor.js";
import { TestResult, AgentLog } from "./types.js";

export class AgentLoop {
  private messages: AIMessage[] = [];
  private logs: AgentLog[] = [];

  constructor(
    private aiProvider: AIProvider,
    private page: Page,
    private onLog?: (log: AgentLog) => void
  ) {}

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

    this.log("info", `Starting test: ${testCase}`);

    // Initial user message
    this.messages = [
      {
        role: "user",
        content: `You are an AI assistant testing a web application. Execute the following test case:\n\n${testCase}\n\nUse the available tools to navigate, interact, and verify the application. At the end, provide your conclusion about whether the test passed or failed.`,
      },
    ];

    let loopCount = 0;
    const maxLoops = 10;

    while (loopCount < maxLoops) {
      loopCount++;
      this.log("info", `Loop iteration ${loopCount}/${maxLoops}`);

      // Get response from AI
      const response = await this.aiProvider.chat(this.messages, AGENT_TOOLS);
      this.log("info", `AI response received`, { stopReason: response.stopReason, hasToolUse: !!response.toolUse });

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

      // If no tool use, we're done
      if (!response.toolUse || response.stopReason === "end_turn") {
        this.log("info", `Test completed`, { reason: response.stopReason });
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

    // Extract conclusion from the final message
    const lastMessage = this.messages[this.messages.length - 1];
    const conclusion =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : lastMessage.content?.find((c) => (c as any).type === "text")?.text || "No conclusion";

    const passed = conclusion.toLowerCase().includes("pass") || conclusion.toLowerCase().includes("success");

    this.log("info", `Test result: ${passed ? "PASSED" : "FAILED"}`, { duration, conclusion });

    return {
      testId,
      passed,
      reasoning: conclusion,
      logs: this.logs,
      duration,
    };
  }
}
