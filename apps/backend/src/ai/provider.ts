export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: "text" | "tool_use"; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
}

export interface AIResponse {
  content: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  stopReason: "end_turn" | "tool_use" | "max_tokens";
}

export abstract class AIProvider {
  abstract chat(messages: AIMessage[], tools: ToolDefinition[]): Promise<AIResponse>;
}
