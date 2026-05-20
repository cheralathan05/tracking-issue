const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const email = 'cheralathannadha9098@gmail.com';
  const username = 'cherala';
  const mobile = '8668180041';

  const [userByMobile, userByEmail, userByUsername] = await Promise.all([
    prisma.user.findUnique({ where: { mobile } }),
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  console.log('userByMobile=', JSON.stringify(userByMobile, null, 2));
  console.log('userByEmail=', JSON.stringify(userByEmail, null, 2));
  console.log('userByUsername=', JSON.stringify(userByUsername, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
