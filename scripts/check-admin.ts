import * as dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@loind.com" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    console.log("❌ admin@loind.com 계정이 존재하지 않습니다.");
  } else {
    console.log(`✅ 계정 존재`);
    console.log(`  id:   ${user.id}`);
    console.log(`  name: ${user.name}`);
    console.log(`  role: ${user.role}`);
    console.log(`  passwordHash 존재: ${!!user.passwordHash}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
