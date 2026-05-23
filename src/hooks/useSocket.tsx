import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

function resolveSocketUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      return "http://localhost:4004";
    }

    return window.location.origin;
  }

  return "/";
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export function useSocket(url = resolveSocketUrl(), enabled = true) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getCookie("smartgov_access");
    const shouldConnect = Boolean(enabled && token);

    if (!shouldConnect) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const s = io(url, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: false,
      auth: { token },
    });

    s.on("connect_error", (err: any) => {
      // if auth problems, disconnect to avoid noisy reconnection loops
      if (err && (err.message === "Missing token" || err.message === "Unauthorized")) {
        s.disconnect();
      }
    });

    s.connect();
    socketRef.current = s;

    s.on("connect", () => {
      try {
        const globalUser = (window as any).__SMARTGOV_USER;
        if (globalUser && (globalUser.id || globalUser.role)) {
          s.emit("identify", { userId: globalUser.id, role: globalUser.role });
        }
      } catch (e) {}
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [url, enabled]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (!handler) socketRef.current?.off(event);
    else socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, payload?: any) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { socketRef, on, off, emit } as const;
}
