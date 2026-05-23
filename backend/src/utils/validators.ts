import { z } from "zod";
import { env } from "../config/env.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

function getEmailDomain(email: string): string {
  const normalized = email.trim().toLowerCase();
  return normalized.split("@")[1] ?? "";
}

export function isGovernmentEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    env.ADMIN_ALLOWED_EMAILS.includes(normalized) ||
    env.ALLOWED_ADMIN_DOMAINS.includes(getEmailDomain(normalized))
  );
}

const officialAdminEmailSchema = emailSchema;

const mobileSchema = z
  .string()
  .trim()
  .regex(/^(?:\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid mobile number")
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  });
const aadhaarSchema = z
  .string()
  .trim()
  .regex(/^(?:\d{4}\s?){3}$/, "Enter a valid Aadhaar number")
  .transform((value) => value.replace(/\s/g, ""));

const textSchema = z.string().trim().min(1, "This field is required");

export const registerSchema = z
  .object({
    fullName: textSchema.min(3, "Full name must be at least 3 characters long"),
    email: emailSchema,
    mobile: mobileSchema,
    aadhaar: aadhaarSchema,
    state: textSchema,
    district: textSchema,
    address: textSchema.min(5, "Address must be at least 5 characters long"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export const adminRegisterSchema = z
  .object({
    fullName: textSchema.min(3, "Full name must be at least 3 characters long"),
    email: emailSchema,
    mobile: mobileSchema,
    state: textSchema,
    district: textSchema,
    address: textSchema,
    role: z.enum([
      "super_admin",
      "state_admin",
      "district_officer",
      "department_officer",
      "admin",
      "officer",
    ]),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or mobile is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const adminLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Email, username, or mobile is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  purpose: z.enum(["registration", "password_reset", "admin_login"]).default("password_reset"),
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const complaintCategorySchema = z.enum([
  "Water Supply",
  "Electricity",
  "Roads",
  "Sanitation",
  "Corruption",
  "Public Safety",
  "Health",
  "Others",
]);

const complaintPrioritySchema = z.enum(["Low", "Medium", "High", "Critical"]);

const complaintEvidenceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().nonnegative(),
  dataUrl: z.string().min(1),
});

const complaintStatusSchema = z.enum([
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Awaiting Information",
  "Resolved",
  "Escalated",
  "Rejected",
  "Closed",
]);

export const complaintSubmissionSchema = z.object({
  reporterName: textSchema.min(3, "Reporter name must be at least 3 characters long"),
  reporterEmail: emailSchema.optional().or(z.literal("")),
  reporterMobile: mobileSchema,
  title: textSchema.min(6, "Complaint title must be at least 6 characters long"),
  category: complaintCategorySchema,
  description: textSchema.min(20, "Description must be at least 20 characters long"),
  state: textSchema,
  district: textSchema,
  city: textSchema.min(2, "City or ward is required"),
  address: textSchema.min(5, "Address must be at least 5 characters long"),
  landmark: z.string().trim().optional().or(z.literal("")),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be a 6-digit number"),
  priority: complaintPrioritySchema,
  publicVisibility: z.boolean().default(true),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  evidence: z.array(complaintEvidenceSchema).max(6).default([]),
});

export const complaintStatusUpdateSchema = z.object({
  status: complaintStatusSchema,
  note: z.string().trim().optional().or(z.literal("")),
  resolutionSummary: z.string().trim().optional().or(z.literal("")),
  resolutionEvidence: z.array(complaintEvidenceSchema).max(6).optional().default([]),
});

export const complaintMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export const complaintAssignmentSchema = z.object({
  officerId: z.string().trim().optional().or(z.literal("")),
  useSuggestedOfficer: z.boolean().default(true),
});

export const officerInvitationSchema = z.object({
  fullName: textSchema.min(3, "Officer name must be at least 3 characters long"),
  email: emailSchema,
  mobile: mobileSchema,
  department: z.enum([
    "Water Supply",
    "Electricity",
    "Roads",
    "Sanitation",
    "Public Safety",
    "Health",
    "Corruption",
    "Others",
  ]),
  area: z
    .string()
    .trim()
    .min(3, "Assigned area must be at least 3 characters long")
    .regex(/^[A-Za-z0-9\s.,'()-]+$/, "Assigned area contains invalid characters"),
  username: z.string().trim().min(3, "Username must be at least 3 characters long").optional(),
});

export const acceptOfficerInvitationSchema = z
  .object({
    username: z.string().trim().min(3, "Username must be at least 3 characters long").optional(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export const complaintQuerySchema = z.object({
  view: z.enum(["all", "mine", "assigned"]).optional().default("all"),
  status: complaintStatusSchema.optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  summaryOnly: z.preprocess((value) => value === true || value === "true", z.boolean()).optional().default(false),
});

export const adminUserQuerySchema = z.object({
  scope: z.enum(["all", "citizen", "officer", "admin"]).optional().default("all"),
  verification: z.enum(["all", "verified", "pending"]).optional().default("all"),
  search: z.string().trim().optional(),
});

export const adminUserUpdateSchema = z
  .object({
    role: z
      .enum([
        "super_admin",
        "state_admin",
        "district_officer",
        "department_officer",
        "citizen",
        "admin",
        "officer",
      ])
      .optional(),
    isVerified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine(
    (data) =>
      typeof data.role !== "undefined" ||
      typeof data.isVerified !== "undefined" ||
      typeof data.emailVerified !== "undefined",
    {
      message: "At least one field is required",
      path: ["role"],
    },
  );

export const officerStatusSchema = z.enum(["Pending", "Accepted", "Revoked", "Expired"]);

export type ComplaintSubmissionInput = z.infer<typeof complaintSubmissionSchema>;
export type ComplaintStatusUpdateInput = z.infer<typeof complaintStatusUpdateSchema>;
export type ComplaintAssignmentInput = z.infer<typeof complaintAssignmentSchema>;
export type ComplaintMessageInput = z.infer<typeof complaintMessageSchema>;
export type OfficerInvitationInput = z.infer<typeof officerInvitationSchema>;
export type AcceptOfficerInvitationInput = z.infer<typeof acceptOfficerInvitationSchema>;
export type ComplaintQueryInput = z.infer<typeof complaintQuerySchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
