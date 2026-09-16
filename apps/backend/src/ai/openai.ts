import OpenAI from "openai";
import { AIProvider, ToolDefinition, AIMessage, AIResponse } from "./provider.js";

export class OpenAIProvider extends AIProvider {
  private client: OpenAI;
  private model = "gpt-4-turbo";

  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: AIMessage[], tools: ToolDefinition[]): Promise<AIResponse> {
    const convertedMessages = messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content,
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 4096,
      tools: tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      })),
      messages: convertedMessages as Parameters<typeof this.client.chat.completions.create>[0]["messages"],
    });

    let textContent = "";
    let toolUse = undefined;

    for (const choice of response.choices) {
      if (choice.message.content) {
        textContent += choice.message.content;
      }

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        toolUse = {
          id: toolCall.id,
          name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
        };
      }
    }

    return {
      content: textContent,
      toolUse,
      stopReason: response.choices[0]?.finish_reason === "tool_calls" ? "tool_use" : "end_turn",
    };
  }
}
