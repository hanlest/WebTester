/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BACKEND_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
