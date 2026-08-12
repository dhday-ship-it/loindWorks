/**
 * FK 및 인덱스 설정
 */
import * as dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

async function safeExec(sql: string, label: string) {
  try {
    await client.query(sql);
    console.log(`✅ ${label}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      console.log(`ℹ️  ${label} (이미 존재)`);
    } else {
      console.log(`⚠️  ${label}: ${msg}`);
    }
  }
}

async function main() {
  await client.connect();
  console.log("✅ 연결\n");

  // TaskComment FK
  await safeExec(
    `ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey"
     FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE`,
    "TaskComment.taskId FK"
  );
  await safeExec(
    `ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey"
     FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE`,
    "TaskComment.authorId FK"
  );

  // TaskHistory FK
  await safeExec(
    `ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey"
     FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE`,
    "TaskHistory.taskId FK"
  );

  // Notification FK
  await safeExec(
    `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
     FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE`,
    "Notification.userId FK"
  );
  await safeExec(
    `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey"
     FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE`,
    "Notification.taskId FK"
  );

  // Task.projectId FK
  await safeExec(
    `ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey"
     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE`,
    "Task.projectId FK"
  );

  // ProjectFile.taskId FK
  await safeExec(
    `ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_taskId_fkey"
     FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE`,
    "ProjectFile.taskId FK"
  );

  // Task 기존 태그 컬럼 제거 (스키마에 없음)
  const tagCol = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Task' AND column_name = 'tag'
  `);
  if (tagCol.rows.length > 0) {
    await safeExec(`ALTER TABLE "Task" DROP COLUMN IF EXISTS tag`, "Task.tag 컬럼 제거");
  }

  // Task status 기본값 업데이트 (PENDING → WAIT)
  await safeExec(
    `ALTER TABLE "Task" ALTER COLUMN status SET DEFAULT 'WAIT'::"TaskStatus"`,
    "Task.status 기본값 WAIT 설정"
  );

  // 기존 PENDING 태스크를 WAIT으로 변환
  const pendingCount = await client.query(
    `SELECT COUNT(*) FROM "Task" WHERE status::text = 'PENDING'`
  );
  if (parseInt(pendingCount.rows[0].count) > 0) {
    await client.query(`UPDATE "Task" SET status = 'WAIT'::"TaskStatus" WHERE status::text = 'PENDING'`);
    console.log(`✅ 기존 PENDING 태스크 → WAIT 변환 (${pendingCount.rows[0].count}건)`);
  }

  await client.end();
  console.log("\n✅ FK/인덱스 설정 완료");
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});
