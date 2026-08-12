import * as dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// 확인할 비밀번호를 여기에 입력
const TEST_PASSWORD = process.argv[2];

async function main() {
  if (!TEST_PASSWORD) {
    console.log("사용법: npx tsx scripts/verify-password.ts <비밀번호>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: "admin@loind.com" },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    console.log("❌ passwordHash 없음");
    await prisma.$disconnect();
    return;
  }

  const ok = await bcrypt.compare(TEST_PASSWORD, user.passwordHash);
  console.log(ok ? "✅ 비밀번호 일치" : "❌ 비밀번호 불일치");

  await prisma.$disconnect();
}

main().catch(console.error);
