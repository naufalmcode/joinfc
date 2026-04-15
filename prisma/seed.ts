import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed default site settings
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "JOIN Football Community",
      description: "Komunitas sepakbola JOIN FC - Bermain bersama, berkembang bersama!",
      primaryColor: "#16a34a",
      secondaryColor: "#065f46",
      accentColor: "#fbbf24",
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
