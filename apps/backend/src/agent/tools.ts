import { ToolDefinition } from "../ai/index.js";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "navigate",
    description:
      "Navigate the browser to a specific URL. Only use this if the test case explicitly asks to go to a different URL than the one currently loaded, or to reload/return to the starting page. Do NOT use this to guess or assume a URL for the application under test - the page is already loaded at the correct URL.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The exact URL to navigate to" },
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
    description:
      "Capture a screenshot for logging. Does not return image data to the model; use getPageState or getAccessibilityTree to inspect the page.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getPageState",
    description:
      "Get structured page state: URL, title, visible modals/dialogs, alert/error text, whether login fields are still visible, and a short text snippet. Use after login submit or navigation before pass/fail.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "wait",
    description: "Wait for a number of milliseconds (e.g. after form submit while the app loads or shows a modal)",
    input_schema: {
      type: "object",
      properties: {
        ms: { type: "number", description: "Milliseconds to wait (e.g. 2000–4000 after login)" },
      },
      required: ["ms"],
    },
  },
  {
    name: "pressKey",
    description: "Press a keyboard key in the page (e.g. Escape to close a modal)",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string", description: 'Key name, e.g. "Escape", "Enter"' },
      },
      required: ["key"],
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
  {
    name: "reportBug",
    description:
      "File a bug report with screenshot, console logs, network errors, and DOM snapshot. Use when you find a defect. Severity can be estimated from impact.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short bug title" },
        description: { type: "string", description: "What went wrong and expected behavior" },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Estimated severity" },
        steps: { type: "array", items: { type: "string" }, description: "Steps to reproduce" },
      },
      required: ["title", "description", "severity"],
    },
  },
  {
    name: "queryDatabase",
    description: "Run a read-only SELECT query against the configured Postgres database (validation / data checks).",
    input_schema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SELECT query only" },
      },
      required: ["sql"],
    },
  },
  {
    name: "finishTest",
    description:
      "Call this exactly once, as the final action, to report the outcome of the test case. You MUST call this instead of just writing a text conclusion - it is the only way to record whether the test passed or failed.",
    input_schema: {
      type: "object",
      properties: {
        passed: {
          type: "boolean",
          description:
            "true if the test case's expected outcome was verified. For login tests, true when authentication clearly succeeded even if a non-error modal appeared or the URL is not exactly /dashboard.",
        },
        reasoning: { type: "string", description: "Explanation of what was checked and why the test passed or failed. Must be written in Spanish (español)." },
      },
      required: ["passed", "reasoning"],
    },
  },
];
