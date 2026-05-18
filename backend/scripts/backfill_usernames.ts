import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sanitizeBase(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 30);
}

async function ensureUnique(base: string) {
  let candidate = base;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.user.findUnique({ where: { username: candidate } as any });
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
    if (suffix > 1000) throw new Error("Unable to generate unique username");
  }
}

async function main() {
  console.log("Starting backfill of missing usernames...");
  const users = await prisma.user.findMany({ where: { username: null }, select: { id: true, email: true, fullName: true } });

  console.log(`Found ${users.length} users without username`);

  let updated = 0;
  for (const u of users) {
    const baseFromEmail = u.email ? sanitizeBase(u.email.split("@")[0] ?? "user") : "user";
    const baseFromName = u.fullName ? sanitizeBase(u.fullName.replace(/\s+/g, ".")) : "";
    const base = baseFromEmail || baseFromName || `user${u.id.slice(0, 6)}`;

    try {
      const username = await ensureUnique(base);
      await prisma.user.update({ where: { id: u.id }, data: { username } });
      updated += 1;
      console.log(`Updated user ${u.id} -> ${username}`);
    } catch (err) {
      console.error(`Failed to generate username for ${u.id}:`, err);
    }
  }

  console.log(`Backfill complete. Updated ${updated} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
