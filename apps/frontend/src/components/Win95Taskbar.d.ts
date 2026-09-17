export declare function Win95StartLogo(): import("react").JSX.Element;
export interface Win95TaskbarTask {
    id: string;
    label: string;
    pressed?: boolean;
}
interface Win95TaskbarProps {
    tasks: Win95TaskbarTask[];
    onTaskClick?: (id: string) => void;
}
export declare function Win95Taskbar({ tasks, onTaskClick }: Win95TaskbarProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Win95Taskbar.d.ts.map