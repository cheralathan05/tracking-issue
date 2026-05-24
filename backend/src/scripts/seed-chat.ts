import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding chat demo data...");

  const hashed = await bcrypt.hash("Password123!", 10);

  const citizen = await prisma.user.upsert({
    where: { email: "citizen@example.com" },
    update: {},
    create: {
      fullName: "Demo Citizen",
      email: "citizen@example.com",
      mobile: "9000000001",
      aadhaar: "000000000001",
      state: "Demo",
      district: "Demo",
      address: "Demo address",
      password: hashed,
      role: "citizen",
      isVerified: true,
      emailVerified: true,
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: "officer@example.com" },
    update: {},
    create: {
      fullName: "Demo Officer",
      email: "officer@example.com",
      mobile: "9000000002",
      aadhaar: "000000000002",
      state: "Demo",
      district: "Demo",
      address: "Demo address",
      password: hashed,
      role: "officer",
      isVerified: true,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      fullName: "Demo Admin",
      email: "admin@example.com",
      mobile: "9000000003",
      aadhaar: "000000000003",
      state: "Demo",
      district: "Demo",
      address: "Demo address",
      password: hashed,
      role: "admin",
      isVerified: true,
      emailVerified: true,
    },
  });

  const complaint = await prisma.complaint.create({
    data: {
      grievanceId: `G-${Date.now()}`,
      reporterUserId: citizen.id,
      reporterName: citizen.fullName,
      title: "Demo water leak",
      category: "Water",
      department: "Water & Sewage",
      description: "There is a demo water leak in the demo area.",
      state: "Demo",
      district: "Demo",
      city: "Demo City",
      address: "Demo street",
      pincode: "000000",
      priority: "High",
    },
  });

  const room = await prisma.chatRoom.create({ data: { complaintId: complaint.id } });

  await prisma.chatParticipant.createMany({
    data: [
      { id: `${room.id}-${citizen.id}`, roomId: room.id, userId: citizen.id, role: "citizen" },
      { id: `${room.id}-${officer.id}`, roomId: room.id, userId: officer.id, role: "officer" },
      { id: `${room.id}-${admin.id}`, roomId: room.id, userId: admin.id, role: "admin" },
    ],
    skipDuplicates: true,
  });

  await prisma.chatMessage.createMany({
    data: [
      { roomId: room.id, senderId: citizen.id, complaintId: complaint.id, message: "Hello, I have a water leak.", messageType: "text" },
      { roomId: room.id, senderId: officer.id, complaintId: complaint.id, message: "Thanks, we're dispatching a crew.", messageType: "text" },
      { roomId: room.id, senderId: admin.id, complaintId: complaint.id, message: "Admin note: tracking this case.", messageType: "system" },
    ],
  });

  console.log("Seed complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
