/**
 * Role enum 직접 마이그레이션 (pg 드라이버 직접 사용)
 */
import * as dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const directUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const client = new pg.Client({ connectionString: directUrl });

async function main() {
  await client.connect();
  console.log("✅ DB 연결 성공\n");

  // 1. 잔여 CLIENT/BRAND_ADMIN 유저 강제 변환 (USING 절로 cast)
  await client.query(
    `UPDATE "User" SET role = 'STAFF'::text::"Role" WHERE role::text IN ('CLIENT', 'BRAND_ADMIN')`
  );
  console.log("✅ 잔여 CLIENT/BRAND_ADMIN → STAFF 변환");

  // 2. 기본값 제거
  await client.query(`ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT`);
  console.log("✅ role 기본값 제거");

  // 3. text로 임시 변환
  await client.query(
    `ALTER TABLE "User" ALTER COLUMN role TYPE text USING role::text`
  );
  console.log("✅ role 컬럼 text로 변환");

  // 4. 기존 enum 삭제
  await client.query(`DROP TYPE IF EXISTS "Role" CASCADE`);
  console.log("✅ 기존 Role enum 삭제");

  // 5. 새 enum 생성
  await client.query(
    `CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PM', 'STAFF')`
  );
  console.log("✅ 새 Role enum 생성 (SUPER_ADMIN, PM, STAFF)");

  // 6. 컬럼 다시 새 enum으로 변환
  await client.query(
    `ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING role::"Role"`
  );
  console.log("✅ role 컬럼 새 enum으로 복원");

  // 7. 기본값 STAFF 설정
  await client.query(
    `ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'STAFF'::"Role"`
  );
  console.log("✅ role 기본값 STAFF 설정");

  // 8. 결과 확인
  const result = await client.query(
    `SELECT email, name, role FROM "User" ORDER BY role`
  );
  console.log("\n현재 유저 목록:");
  for (const row of result.rows) {
    console.log(`  ${row.email} (${row.name ?? "-"}) → ${row.role}`);
  }

  await client.end();
  console.log("\n✅ Role enum 마이그레이션 완료");
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});
