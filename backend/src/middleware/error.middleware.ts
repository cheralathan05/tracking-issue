import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";

import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details ?? undefined,
    });
    return;
  }

  console.error(error);
  if (env.NODE_ENV === "development") {
    res.status(500).json({
      success: false,
      message: error?.message ?? "Internal server error",
      stack: error?.stack ?? undefined,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
