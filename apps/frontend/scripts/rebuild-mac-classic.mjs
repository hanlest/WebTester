import fs from "fs";
import path from "path";

const themes = path.resolve("apps/frontend/src/themes");
const file = fs.readFileSync(path.join(themes, "mac-classic.css"), "utf8");
const splitMarker = "/* Ventana: borde simple, sin marco W3.x */";
const shellStart = file.indexOf("[data-visual-theme=\"mac-classic-ii\"] body {\n  image-rendering: pixelated;");
const splitIdx = file.indexOf(splitMarker);
if (shellStart < 0 || splitIdx < 0) throw new Error("markers not found");

const varsEnd = file.indexOf("}", file.indexOf('[data-visual-theme="mac-classic-ii"]')) + 1;
const head = file.slice(0, varsEnd);
const macShell = file.slice(shellStart, splitIdx).trim();
const tail = file.slice(splitIdx);

const macLayout = `/* Escritorio y menú Mac */
[data-visual-theme="mac-classic-ii"] body,
[data-visual-theme="mac-classic-ii"] .app {
  font-family: var(--wt-font);
  font-size: 12px;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
  font-smooth: never;
  image-rendering: pixelated;
}

[data-visual-theme="mac-classic-ii"] body {
  background-color: #ffffff;
  background-image: var(--wt-mac-dither);
  background-size: 2px 2px;
}

[data-visual-theme="mac-classic-ii"] .app {
  flex-direction: column !important;
  gap: 0;
  padding: 0;
  min-height: 100vh;
  background-color: transparent;
  background-image: var(--wt-mac-dither);
  background-size: 2px 2px;
}

[data-visual-theme="mac-classic-ii"] .mac-screen-menu-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  width: 100%;
  min-height: 20px;
  padding: 2px 10px 3px;
  box-sizing: border-box;
  background: #ffffff;
  border-bottom: 1px solid #000000;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #000000;
}

[data-visual-theme="mac-classic-ii"] .mac-menu-apple {
  display: block;
  width: 10px;
  height: 12px;
  flex-shrink: 0;
  background-color: #000000;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 14'%3E%3Cpath d='M9.2 1.1c.6.7 1 1.7.9 2.7-.9 0-1.8-.5-2.4-1.2-.6-.7-1.1-1.7-.9-2.7.9.1 1.8.6 2.4 1.2zm2.5 9.4c-.6.9-1.3 1.8-2.3 1.8-1 0-1.3-.6-2.4-.6-1.1 0-1.5.6-2.5.6-1 0-1.9-.9-2.5-1.8C1.2 9.2.5 6.8 1.6 4.9c.7-1.2 1.9-2 3.2-2 .9 0 1.7.6 2.4.6.7 0 1.6-.7 2.7-.7.5 0 2 .2 2.9 1.5-2.5 1.4-2.1 5.1.7 6.2z'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 14'%3E%3Cpath d='M9.2 1.1c.6.7 1 1.7.9 2.7-.9 0-1.8-.5-2.4-1.2-.6-.7-1.1-1.7-.9-2.7.9.1 1.8.6 2.4 1.2zm2.5 9.4c-.6.9-1.3 1.8-2.3 1.8-1 0-1.3-.6-2.4-.6-1.1 0-1.5.6-2.5.6-1 0-1.9-.9-2.5-1.8C1.2 9.2.5 6.8 1.6 4.9c.7-1.2 1.9-2 3.2-2 .9 0 1.7.6 2.4.6.7 0 1.6-.7 2.7-.7.5 0 2 .2 2.9 1.5-2.5 1.4-2.1 5.1.7 6.2z'/%3E%3C/svg%3E");
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

[data-visual-theme="mac-classic-ii"] .mac-menu-items {
  display: flex;
  align-items: center;
  gap: 14px;
}

[data-visual-theme="mac-classic-ii"] .app .mac-app-windows {
  gap: 12px;
  padding: 10px;
  box-sizing: border-box;
}`;

const merged = `/* Macintosh System 6 / Classic — shell autocontenido (sin Win 3.11) */

${head.trim()}

/* Shell: layout, árbol, controles */
${macShell}

${macLayout}

${tail.trim()}
`;

fs.writeFileSync(path.join(themes, "mac-classic.css"), merged + "\n");
console.log("ok", merged.split("\n").length);
