import type { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";

let io: IOServer | undefined;

export function initSocket(server: HttpServer, origins: string[]) {
  if (io) {
    return io;
  }

  io = new IOServer(server, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
}

export function getSocket() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}

export function safeEmitToUser(userId: string, event: string, payload: unknown) {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
}

export function safeEmitToRole(role: string, event: string, payload: unknown) {
  if (!io) {
    return;
  }

  io.to(`role:${role}`).emit(event, payload);
}
