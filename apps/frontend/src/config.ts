const backendPort = import.meta.env.BACKEND_PORT || "3001";

export const BACKEND_URL = `http://localhost:${backendPort}`;
export const BACKEND_WS_URL = `ws://localhost:${backendPort}`;
