import { prisma } from "./src/config/prisma.ts";

async function main() {
  console.log("=== LOGIN ACTIVITY REPORT ===\n");

  // Get all users sorted by last login
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      isVerified: true,
    },
    orderBy: {
      lastLoginAt: {
        sort: "desc",
        nulls: "last",
      },
    },
  });

  console.log(`Total Users: ${users.length}\n`);

  console.log("Users sorted by Last Login (Most Recent First):");
  console.log("─".repeat(100));
  
  users.forEach((user, index) => {
    const lastLogin = user.lastLoginAt 
      ? new Date(user.lastLoginAt).toLocaleString()
      : "Never logged in";
    
    console.log(`${index + 1}. ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Last Login: ${lastLogin}`);
    console.log(`   Account Created: ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   Verified: ${user.isVerified ? "Yes" : "No"}`);
    console.log();
  });

  // Get refresh token activity
  const refreshTokens = await prisma.refreshToken.findMany({
    select: {
      userId: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log("\n=== Recent Token Activity (Last 20) ===");
  console.log("─".repeat(100));
  
  for (const token of refreshTokens) {
    const user = users.find(u => u.id === token.userId);
    console.log(`User: ${user?.fullName} (${user?.email})`);
    console.log(`  Token Created: ${new Date(token.createdAt).toLocaleString()}`);
    console.log(`  Token Expires: ${new Date(token.expiresAt).toLocaleString()}`);
    console.log(`  IP: ${token.ipAddress || "Unknown"}`);
    console.log(`  User Agent: ${token.userAgent || "Unknown"}`);
    console.log();
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
