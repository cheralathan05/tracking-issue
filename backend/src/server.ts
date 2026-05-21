import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import http from "http";
import * as chatService from "./services/chat.service.js";
import { initSocket } from "./socket.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    const server = http.createServer(app);
    const io = initSocket(server, env.FRONTEND_ORIGIN.split(",").map((s) => s.trim()));

    io.on("connection", (socket) => {
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

      // Socket authentication middleware: accept token via handshake.auth.token or cookies
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
        socket.on("joinRoom", async (roomId: string) => {
          socket.join(`room:${roomId}`);
        });

        socket.on("leaveRoom", (roomId: string) => {
          socket.leave(`room:${roomId}`);
        });

        socket.on("sendMessage", async (payload: any) => {
          try {
            // ensure senderId is trusted
            const senderId = (socket as any).data.user?.id;
            if (!senderId) return;
            const safePayload = { ...payload, senderId };
            const msg = await chatService.sendMessage(safePayload);
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
