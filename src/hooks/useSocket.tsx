import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

function resolveSocketUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" && window.location.port === "3000") {
      return "http://localhost:4000";
    }

    return window.location.origin;
  }

  return "/";
}

export function useSocket(url = resolveSocketUrl()) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io(url, { transports: ["websocket"], autoConnect: true });
    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [url]);

  return socketRef;
}
