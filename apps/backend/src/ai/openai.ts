import OpenAI from "openai";
import { AIProvider, ToolDefinition, AIMessage, AIResponse } from "./provider.js";

type OpenAIChatMessage = {
  role: "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

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
    const openaiMessages: OpenAIChatMessage[] = [];

    for (const msg of messages) {
      if (typeof msg.content === "string") {
        openaiMessages.push({ role: msg.role, content: msg.content });
        continue;
      }

      const content = msg.content as Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      const textBlock = content.find((c) => c.type === "text");
      const toolBlock = content.find((c) => c.type === "tool_use");

      if (msg.role === "assistant" && toolBlock) {
        // Reconstruct the assistant message WITH its tool_calls array
        openaiMessages.push({
          role: "assistant",
          content: textBlock?.text || null,
          tool_calls: [
            {
              id: toolBlock.id!,
              type: "function",
              function: {
                name: toolBlock.name!,
                arguments: JSON.stringify(toolBlock.input || {}),
              },
            },
          ],
        });
      } else if (msg.role === "user" && toolBlock) {
        // This is a tool result, keyed by the same tool_call id
        openaiMessages.push({
          role: "tool",
          tool_call_id: toolBlock.id!,
          content: textBlock?.text || "",
        });
      } else {
        openaiMessages.push({
          role: msg.role,
          content: textBlock?.text || "",
        });
      }
    }

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
      messages: openaiMessages as Parameters<typeof this.client.chat.completions.create>[0]["messages"],
    });

    let textContent = "";
    let toolUse = undefined;

    const choice = response.choices[0];
    if (choice.message.content) {
      textContent = choice.message.content;
    }

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      toolUse = {
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments),
      };
    }

    return {
      content: textContent,
      toolUse,
      stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn",
    };
  }
}
