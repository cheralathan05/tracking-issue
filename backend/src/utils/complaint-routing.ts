import type { User } from "@prisma/client";

const departmentByCategory: Record<string, string> = {
  "Water Supply": "Water Supply Dept.",
  Electricity: "Municipal Electricity Dept.",
  Roads: "Public Works Dept.",
  Sanitation: "Sanitation Dept.",
  Corruption: "Anti-Corruption Cell",
  "Public Safety": "Public Safety Dept.",
  Health: "Health Dept.",
  Others: "General Administration Dept.",
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeKey(value: string | null | undefined): string {
  return normalize(value).replace(/[^a-z0-9]+/g, " ");
}

export function deriveDepartment(category: string): string {
  return departmentByCategory[category] ?? "General Administration Dept.";
}

export function isAreaMatch(source: string | null | undefined, target: string | null | undefined): boolean {
  const normalizedSource = normalizeKey(source);
  const normalizedTarget = normalizeKey(target);

  if (!normalizedSource || !normalizedTarget) {
    return false;
  }

  return normalizedSource === normalizedTarget || normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource);
}

export function generateComplaintId(existingIds: Set<string> = new Set()): string {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `GRV-${year}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  return `GRV-${year}-${Date.now().toString().slice(-5)}`;
}

export function generateOfficerCode(existingCodes: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `OFF-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `OFF-${Date.now().toString().slice(-4)}`;
}

export function generateInvitationCode(existingCodes: Set<string> = new Set()): string {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `INV-${year}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `INV-${year}-${Date.now().toString().slice(-5)}`;
}

export function pickSuggestedOfficer(
  officers: Array<Pick<User, "id" | "fullName" | "department" | "jurisdictionArea">>,
  complaint: { category: string; city: string; district: string; department: string },
) {
  const matchesByDepartment = officers.filter((officer) =>
    normalizeKey(officer.department).includes(normalizeKey(complaint.department)),
  );

  const matchesByArea = matchesByDepartment.filter((officer) =>
    isAreaMatch(officer.jurisdictionArea, complaint.city) || isAreaMatch(officer.jurisdictionArea, complaint.district),
  );

  const pick = matchesByArea[0] ?? matchesByDepartment[0] ?? officers[0] ?? null;

  return pick;
}
