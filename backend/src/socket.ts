import type { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";

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

  // Socket.IO event handlers
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // User joins their personal notification room
    socket.on("joinUser", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    // Admin joins monitoring room
    socket.on("adminJoinMonitoring", (adminId: string) => {
      socket.join("admin_monitoring");
      socket.join(`admin:${adminId}`);
      console.log(`Admin ${adminId} joined monitoring room`);

      // Notify other admins
      io!.to("admin_monitoring").emit("admin_online", { adminId });
    });

    // User joins a chat room
    socket.on("joinRoom", (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`Client ${socket.id} joined room ${roomId}`);
    });

    // Admin monitors a specific room
    socket.on("adminMonitorRoom", (roomId: string) => {
      socket.join(`room:${roomId}`);
      socket.join(`admin_monitor:${roomId}`);
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
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

export function broadcastToAdmins(event: string, payload: unknown) {
  if (!io) {
    return;
  }

  io.to("admin_monitoring").emit(event, payload);
}

export function emitToRoom(roomId: string, event: string, payload: unknown) {
  if (!io) {
    return;
  }

  io.to(`room:${roomId}`).emit(event, payload);
}
