import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(url = "/") {
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
