import type { ScreencastFrame } from "@web-tester/shared";
import { DeviceProfile } from "@web-tester/shared";
import type { BrowserLogEntry } from "../hooks/useSessionWebSocket";
import "./Browser.css";
interface BrowserProps {
    deviceProfile: DeviceProfile;
    browserLogs: BrowserLogEntry[];
    screencastPaused: boolean;
    subscribeScreencast: (listener: (frame: ScreencastFrame) => void) => () => void;
}
export declare function Browser({ deviceProfile, browserLogs, screencastPaused, subscribeScreencast }: BrowserProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Browser.d.ts.map