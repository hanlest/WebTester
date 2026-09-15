import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, ToolDefinition, AIMessage, AIResponse } from "./provider.js";

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;
  private model = "claude-3-5-sonnet-20241022";

  constructor() {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: AIMessage[], tools: ToolDefinition[]): Promise<AIResponse> {
    const convertedMessages = messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      })),
      messages: convertedMessages as Parameters<typeof this.client.messages.create>[0]["messages"],
    });

    let textContent = "";
    let toolUse = undefined;

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolUse = {
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }
    }

    return {
      content: textContent,
      toolUse,
      stopReason: response.stop_reason === "tool_use" ? "tool_use" : response.stop_reason === "max_tokens" ? "max_tokens" : "end_turn",
    };
  }
}
