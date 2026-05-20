import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import http from "http";
import { Server as IOServer } from "socket.io";
import * as chatService from "./services/chat.service.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    const server = http.createServer(app);
    const io = new IOServer(server, {
      cors: {
        origin: env.FRONTEND_ORIGIN.split(",").map((s) => s.trim()),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      socket.on("joinRoom", async (roomId: string) => {
        socket.join(`room:${roomId}`);
      });

      socket.on("leaveRoom", (roomId: string) => {
        socket.leave(`room:${roomId}`);
      });

      socket.on("sendMessage", async (payload: any) => {
        try {
          const msg = await chatService.sendMessage(payload);
          io.to(`room:${payload.roomId}`).emit("message", msg);
        } catch (e) {
          // ignore or emit error
        }
      });
    });

    server.listen(env.PORT, () => {
      console.log(`SmartGov auth backend listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start SmartGov auth backend", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

void bootstrap();
