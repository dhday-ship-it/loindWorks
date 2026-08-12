/**
 * Role 마이그레이션 스크립트
 * - CLIENT → STAFF
 * - BRAND_ADMIN → STAFF (PM으로 수동 변경 필요)
 * 실행: npx tsx scripts/migrate-roles.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 현재 역할 분포 확인
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("\n현재 유저 목록:");
  for (const u of users) {
    console.log(`  ${u.email} (${u.name ?? "-"}) → role: ${u.role}`);
  }

  // CLIENT → STAFF 변환
  const clients = users.filter((u) => u.role === "CLIENT");
  const brandAdmins = users.filter((u) => u.role === "BRAND_ADMIN");

  if (clients.length > 0) {
    console.log(`\nCLIENT ${clients.length}명을 STAFF로 변환합니다...`);
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET role = 'STAFF' WHERE role = 'CLIENT'`
    );
    console.log("✅ CLIENT → STAFF 완료");
  }

  if (brandAdmins.length > 0) {
    console.log(`\nBRAND_ADMIN ${brandAdmins.length}명을 STAFF로 변환합니다...`);
    console.log("(PM으로 바꾸려면 이후 수동으로 변경하세요)");
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET role = 'STAFF' WHERE role = 'BRAND_ADMIN'`
    );
    console.log("✅ BRAND_ADMIN → STAFF 완료");
  }

  if (clients.length === 0 && brandAdmins.length === 0) {
    console.log("\n✅ 변환할 유저 없음");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
