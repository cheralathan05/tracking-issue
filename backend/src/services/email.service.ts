import { env } from "../config/env.js";
import { hasSmtpConfig, transporter } from "../config/mailer.js";

async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string,
  title: string,
  description: string,
) {
  const text = [
    `Your OTP for ${description} is: ${otp}`,
    "OTP valid for 10 minutes.",
    "If you did not request this email, you can safely ignore it.",
  ].join("\n\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      <p>Your OTP for ${description} is:</p>
      <div style="display:inline-block; padding: 14px 20px; border-radius: 10px; background: #0f172a; color: #fff; font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 12px 0;">${otp}</div>
      <p>OTP valid for 10 minutes.</p>
      <p>If you did not request this email, you can safely ignore it.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject,
    text,
    html,
  });

  if (!hasSmtpConfig) {
    console.info(`[SmartGov OTP fallback] ${email}: ${otp}`);
  }

  return info;
}

export async function sendPasswordResetOtpEmail(email: string, otp: string) {
  return sendOtpEmail(
    email,
    otp,
    "SmartGov Password Reset OTP",
    "SmartGov Password Reset OTP",
    "password reset",
  );
}

export async function sendEmailVerificationOtpEmail(email: string, otp: string) {
  return sendOtpEmail(
    email,
    otp,
    "SmartGov Email Verification OTP",
    "SmartGov Email Verification OTP",
    "email verification",
  );
}

export async function sendAdminLoginOtpEmail(email: string, otp: string) {
  return sendOtpEmail(
    email,
    otp,
    "SmartGov Admin Login OTP",
    "SmartGov Admin Login OTP",
    "admin login",
  );
}

export async function sendOfficerInvitationEmail(payload: {
  to: string;
  fullName: string;
  department: string;
  area: string;
  invitationUrl: string;
  expiresAt: string;
}) {
  const { to, fullName, department, area, invitationUrl, expiresAt } = payload;

  const subject = `You are invited to join SmartGov as ${department} officer`;

  const text = [`Hello ${fullName},`, `You have been invited to join SmartGov as a ${department} officer for ${area}.`, `Activate your account: ${invitationUrl}`, `This link expires at ${expiresAt}.`, "If you did not expect this invitation, ignore this email."].join("\n\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom:12px;">You are invited to SmartGov</h2>
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>You have been invited to join <strong>SmartGov</strong> as a <strong>${department}</strong> officer for <strong>${area}</strong>.</p>
      <p style="margin:12px 0;">Click the button below to activate your account. The link expires on <strong>${expiresAt}</strong>.</p>
      <div style="margin: 18px 0;">
        <a href="${invitationUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;">Activate account</a>
      </div>
      <p>If the button above doesn't work, copy-paste this URL into your browser:</p>
      <div style="word-break:break-all;color:#6b7280">${invitationUrl}</div>
      <p style="margin-top:12px;color:#6b7280;font-size:13px;">If you did not expect this invitation, you can ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  if (!hasSmtpConfig) {
    console.info(`[SmartGov Invitation fallback] ${to}: ${invitationUrl}`);
  }

  return info;
}
