import type { AgentLog } from "@web-tester/shared";
import "./TestRunner.css";
interface TestRunnerProps {
    sessionId: string;
    agentLogs: AgentLog[];
    onClearAgentLogs: () => void;
}
export declare function TestRunner({ sessionId, agentLogs, onClearAgentLogs }: TestRunnerProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=TestRunner.d.ts.map