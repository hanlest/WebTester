import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { VisualThemeProvider } from "./context/VisualThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VisualThemeProvider>
      <App />
    </VisualThemeProvider>
  </React.StrictMode>
);
