import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  AUTH_ACCESS_COOKIE_NAME: z.string().default("smartgov_access"),
  AUTH_REFRESH_COOKIE_NAME: z.string().default("smartgov_refresh"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1"),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  ACCOUNT_LOCK_THRESHOLD: z.coerce.number().int().positive().default(5),
  ACCOUNT_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_FROM: z.string().default("SmartGov <no-reply@smartgov.gov>"),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  ADMIN_ALLOWED_EMAILS: z
    .string()
    .default("smartgov.admin@gmail.com,tn.state.admin@gmail.com,smartgov.helpdesk@gmail.com")
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ALLOWED_ADMIN_DOMAINS: z
    .string()
    .default("smartgov.in,gov.in,nic.in")
    .transform((value) =>
      value
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    ),
});

export const env = envSchema.parse(process.env);
