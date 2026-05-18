import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    app.listen(env.PORT, () => {
      console.log(`SmartGov auth backend listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start SmartGov auth backend", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

void bootstrap();
