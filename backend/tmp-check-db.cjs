const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const email = 'cheralathannadha9098@gmail.com';
  const username = 'cherala';
  const inviteCode = 'INV-2026-05210';

  const [userByEmail, userByUsername, inviteByEmail, inviteByCode] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
    prisma.officerInvitation.findUnique({ where: { email } }),
    prisma.officerInvitation.findUnique({ where: { code: inviteCode } }),
  ]);

  console.log('userByEmail=', JSON.stringify(userByEmail, null, 2));
  console.log('userByUsername=', JSON.stringify(userByUsername, null, 2));
  console.log('inviteByEmail=', JSON.stringify(inviteByEmail, null, 2));
  console.log('inviteByCode=', JSON.stringify(inviteByCode, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
