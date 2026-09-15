import { AIProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic.js";

export { AIProvider, type ToolDefinition, type AIMessage, type AIResponse } from "./provider.js";

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "anthropic";

  if (provider === "anthropic") {
    return new AnthropicProvider();
  }

  if (provider === "openai") {
    throw new Error("OpenAI provider not yet implemented");
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}
