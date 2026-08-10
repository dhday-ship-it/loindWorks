/**
 * 더미/테스트 요청사항 정리 스크립트
 * 실행: npx tsx scripts/clean-dummy-requests.ts
 *
 * 기본 동작: 요청 목록을 출력만 함 (dry-run)
 * 실제 삭제: DRY_RUN=false npx tsx scripts/clean-dummy-requests.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.env.DRY_RUN !== "false";

async function main() {
  console.log(`\n[${DRY_RUN ? "DRY RUN" : "LIVE DELETE"}] 모든 요청사항 목록:\n`);

  const requests = await prisma.projectRequest.findMany({
    include: {
      author: { select: { name: true, email: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (requests.length === 0) {
    console.log("요청사항이 없습니다.");
    await prisma.$disconnect();
    return;
  }

  requests.forEach((r, i) => {
    console.log(
      `[${String(i + 1).padStart(2, "0")}] id=${r.id}\n     project="${r.project.name}"\n     author=${r.author.name ?? r.author.email}\n     body="${r.body.slice(0, 80)}"\n     createdAt=${r.createdAt.toISOString()}\n`
    );
  });

  // 더미 데이터 패턴: 한글 자음/모음만으로 이루어진 body (예: ㅇㅁㄴㅇㅁㄴ)
  const dummyPattern = /^[ㄱ-ㅎㅏ-ㅣ\s.,!?~]+$/;
  const dummies = requests.filter((r) => dummyPattern.test(r.body.trim()));

  if (dummies.length === 0) {
    console.log("✅ 더미 데이터로 판단되는 요청사항이 없습니다.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  더미로 판단된 요청사항 ${dummies.length}건:`);
  dummies.forEach((r) => {
    console.log(
      `  - id=${r.id}\n    body="${r.body.slice(0, 60)}"\n    project="${r.project.name}"\n`
    );
  });

  if (!DRY_RUN) {
    const ids = dummies.map((r) => r.id);
    const deleted = await prisma.projectRequest.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`\n✅ ${deleted.count}건 삭제 완료.`);
  } else {
    console.log(
      "💡 실제 삭제하려면: DRY_RUN=false npx tsx scripts/clean-dummy-requests.ts"
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
