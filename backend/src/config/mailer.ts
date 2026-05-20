import nodemailer from "nodemailer";

import { env } from "./env.js";

export const hasSmtpConfig = Boolean(
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS,
);

const transportType = hasSmtpConfig
  ? "smtp"
  : env.EMAIL_USER && env.EMAIL_PASS
    ? "gmail"
    : "fallback";

export const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : env.EMAIL_USER && env.EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        },
      })
    : nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "unix",
      });

if (transportType === "fallback") {
  console.warn(
    "[mailer] no SMTP or Gmail credentials configured. Email will not be delivered unless SMTP_HOST/SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS are set.",
  );
}

// Log SMTP configuration at startup to help diagnose email delivery issues
console.info(
  `[mailer] transport=${transportType} hasSmtpConfig=${hasSmtpConfig} host=${env.SMTP_HOST ?? "(none)"} port=${env.SMTP_PORT ?? "(none)"} from=${env.SMTP_FROM}`,
);
