import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { VisualThemeProvider } from "./context/VisualThemeContext";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(VisualThemeProvider, { children: _jsx(App, {}) }) }));
//# sourceMappingURL=main.js.map