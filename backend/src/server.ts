import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import http from "http";
import * as chatService from "./services/chat.service.js";
import { initSocket } from "./socket.js";
import { startScheduledTasks, stopScheduledTasks } from "./scheduler.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    const server = http.createServer(app);
    const io = initSocket(server, env.FRONTEND_ORIGIN.split(",").map((s) => s.trim()));

    function parseCookies(cookieHeader: string | undefined): Record<string, string> {
      if (!cookieHeader) return {};
      return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
        const [name, ...rest] = part.split("=");
        if (!name) return acc;
        const key = name.trim();
        const value = rest.join("=").trim();
        if (key) acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
    }

    io.use(async (socket, next) => {
      try {
        const tokenFromAuth = (socket.handshake.auth && (socket.handshake.auth as any).token) || undefined;
        const cookies = parseCookies(socket.handshake.headers.cookie as string | undefined);
        const token = tokenFromAuth || cookies[env.AUTH_ACCESS_COOKIE_NAME];

        if (!token) {
          return next(new Error("Missing token"));
        }

        const { verifyAccessToken } = await import("./utils/jwt.js");
        const payload = verifyAccessToken(String(token));
        if (!payload.sub) return next(new Error("Unauthorized"));

        const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, fullName: true, role: true, isVerified: true, emailVerified: true } });
        if (!user) return next(new Error("Unauthorized"));
        if (!user.isVerified || !user.emailVerified) return next(new Error("Email not verified"));

        (socket as any).data.user = user;
        next();
      } catch (err) {
        next(err as Error);
      }
    });

    io.on("connection", (socket) => {
      // If authentication middleware already populated user info, auto-join their rooms
      try {
        const user = (socket as any).data?.user;
        if (user && user.id) {
          socket.join(`user:${user.id}`);
          const role = user.role;
          if (role) {
            socket.join(`role:${role}`);

            if (role === "officer") {
              socket.join("role:officer");
            }

            if (["super_admin", "state_admin", "district_officer", "department_officer", "admin"].includes(role)) {
              socket.join("role:admin");
            }

            if (role === "citizen") {
              socket.join("role:citizen");
            }

            const presenceEvent = role === "officer" ? "officer_online" : role === "citizen" ? "citizen_online" : null;
            if (presenceEvent) {
              socket.broadcast.to(`role:${role}`).emit(presenceEvent, {
                userId: user.id,
                role,
                isOnline: true,
              });
            }
          }
        }
      } catch (e) {
        // ignore
      }

      socket.on("identify", ({ userId, role }: { userId?: string; role?: string }) => {
        if (userId) {
          socket.join(`user:${userId}`);
        }

        if (role) {
          socket.join(`role:${role}`);

          if (role === "officer") {
            socket.join("role:officer");
          }

          if (["super_admin", "state_admin", "district_officer", "department_officer", "admin"].includes(role)) {
            socket.join("role:admin");
          }

          if (role === "citizen") {
            socket.join("role:citizen");
          }
        }
      });

      socket.on("joinRoom", async (roomId: string) => {
        socket.join(`room:${roomId}`);
      });

      socket.on("leaveRoom", (roomId: string) => {
        socket.leave(`room:${roomId}`);
      });

      socket.on("typing", ({ roomId, userName, isTyping }: { roomId?: string; userName?: string; isTyping?: boolean }) => {
        if (!roomId) return;
        const payload = {
          roomId,
          userName,
          isTyping: Boolean(isTyping),
        };

        socket.to(`room:${roomId}`).emit("typing", payload);
        socket.to(`room:${roomId}`).emit(isTyping ? "typing_start" : "typing_stop", payload);
      });

      socket.on("sendMessage", async (payload: any) => {
        try {
          // ensure senderId is trusted
          const senderId = (socket as any).data.user?.id;
          if (!senderId) return;
          const safePayload = { ...payload, senderId };
          const msg = await chatService.sendMessage(safePayload);
          io.to(`room:${payload.roomId}`).emit("message", msg);
          io.to(`room:${payload.roomId}`).emit("message_sent", msg);
        } catch (e) {
          // ignore or emit error
        }
      });

      socket.on("disconnect", () => {
        try {
          const user = (socket as any).data?.user;
          if (user && user.role) {
            const presenceEvent = user.role === "officer" ? "officer_online" : user.role === "citizen" ? "citizen_online" : null;
            if (presenceEvent) {
              socket.broadcast.to(`role:${user.role}`).emit(presenceEvent, {
                userId: user.id,
                role: user.role,
                isOnline: false,
              });
            }
          }
        } catch {
          // ignore
        }
      });
    });

    const MAX_PORT_RETRIES = 5;
    let currentPort = Number(env.PORT) || 4000;

    let retriesLeft = MAX_PORT_RETRIES;

    server.on("error", (err: any) => {
      if (err && (err as any).code === "EADDRINUSE") {
        console.error(`Port ${currentPort} is already in use.`);
        if (retriesLeft > 0) {
          retriesLeft -= 1;
          currentPort += 1;
          console.log(`Attempting to listen on port ${currentPort} (retries left: ${retriesLeft})`);
          setTimeout(() => server.listen(currentPort), 100);
        } else {
          console.error(`No available ports after ${MAX_PORT_RETRIES} attempts. Exiting.`);
          process.exit(1);
        }
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });

    server.listen(currentPort, async () => {
      console.log(`SmartGov auth backend listening on port ${currentPort}`);
      
      // Start scheduled tasks after server is ready
      try {
        await startScheduledTasks();
        console.log("✓ All scheduled tasks initialized");
      } catch (error) {
        console.error("Failed to start scheduled tasks:", error);
      }
    });
  } catch (error) {
    console.error("Failed to start SmartGov auth backend", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT signal, shutting down gracefully...");
  stopScheduledTasks();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM signal, shutting down gracefully...");
  stopScheduledTasks();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("uncaughtException", (err: any) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

void bootstrap();
