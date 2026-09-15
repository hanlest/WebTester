import { ToolDefinition } from "../ai/index.js";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "navigate",
    description: "Navigate to a URL in the browser",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "click",
    description: "Click on an element identified by CSS selector",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the element to click" },
      },
      required: ["selector"],
    },
  },
  {
    name: "fill",
    description: "Fill an input field with text",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the input element" },
        text: { type: "string", description: "Text to fill in" },
      },
      required: ["selector", "text"],
    },
  },
  {
    name: "screenshot",
    description: "Take a screenshot of the current page",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getAccessibilityTree",
    description: "Get the accessibility tree (page structure) as text",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "evaluateJS",
    description: "Execute JavaScript code in the page context",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript code to execute" },
      },
      required: ["code"],
    },
  },
  {
    name: "waitForElement",
    description: "Wait for an element to appear on the page",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the element to wait for" },
        timeout: { type: "number", description: "Timeout in milliseconds (default 5000)" },
      },
      required: ["selector"],
    },
  },
  {
    name: "goBack",
    description: "Navigate back to the previous page",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "goForward",
    description: "Navigate forward to the next page",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
