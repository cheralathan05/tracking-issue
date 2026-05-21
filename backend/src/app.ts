import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import path from "node:path";
import { authRouter } from "./routes/auth.routes.js";
import { complaintRouter } from "./routes/complaint.routes.js";
import { officerRouter } from "./routes/officer.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/errors.js";

const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError("CORS blocked for this origin", 403));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SmartGov citizen auth backend is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/officers", officerRouter);
app.use("/api/users", usersRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationRouter);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorHandler);
