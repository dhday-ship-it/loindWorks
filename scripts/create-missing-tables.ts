/**
 * db push 전 누락 테이블/타입 미리 생성
 */
import * as dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

async function main() {
  await client.connect();
  console.log("✅ 연결 성공\n");

  // TaskStatus enum (기존 PENDING/IN_PROGRESS/REVIEW/DONE → 새 값 추가)
  const tsResult = await client.query(`SELECT typname FROM pg_type WHERE typname = 'TaskStatus'`);
  if (tsResult.rows.length > 0) {
    // 기존 enum에 새 값 추가 (없으면 무시)
    const existing = await client.query(`SELECT unnest(enum_range(NULL::"TaskStatus"))::text AS val`);
    const vals = existing.rows.map((r: {val: string}) => r.val);
    console.log("현재 TaskStatus 값:", vals);

    if (!vals.includes('WAIT')) {
      await client.query(`ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'WAIT'`);
      console.log("✅ TaskStatus WAIT 추가");
    }
    if (!vals.includes('FEEDBACK')) {
      await client.query(`ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'FEEDBACK'`);
      console.log("✅ TaskStatus FEEDBACK 추가");
    }
  } else {
    await client.query(`CREATE TYPE "TaskStatus" AS ENUM ('WAIT', 'IN_PROGRESS', 'REVIEW', 'FEEDBACK', 'DONE')`);
    console.log("✅ TaskStatus enum 생성");
  }

  // TaskPriority enum
  const tpResult = await client.query(`SELECT typname FROM pg_type WHERE typname = 'TaskPriority'`);
  if (tpResult.rows.length === 0) {
    await client.query(`CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW')`);
    console.log("✅ TaskPriority enum 생성");
  } else {
    console.log("ℹ️  TaskPriority 이미 존재");
  }

  // NotificationType enum
  const ntResult = await client.query(`SELECT typname FROM pg_type WHERE typname = 'NotificationType'`);
  if (ntResult.rows.length === 0) {
    await client.query(`
      CREATE TYPE "NotificationType" AS ENUM (
        'TASK_ASSIGNED', 'TASK_STATUS', 'TASK_DUE', 'TASK_OVERDUE',
        'TASK_COMMENT', 'TASK_MENTION', 'PROJECT_UPDATE'
      )
    `);
    console.log("✅ NotificationType enum 생성");
  } else {
    console.log("ℹ️  NotificationType 이미 존재");
  }

  // Task 테이블에 새 컬럼 추가 (없으면)
  const taskCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Task' AND column_name IN ('priority', 'order', 'archivedAt', 'projectId')
  `);
  const existingCols = taskCols.rows.map((r: {column_name: string}) => r.column_name);

  if (!existingCols.includes('priority')) {
    await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS priority "TaskPriority" NOT NULL DEFAULT 'NORMAL'`);
    console.log("✅ Task.priority 추가");
  }
  if (!existingCols.includes('order')) {
    await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0`);
    console.log("✅ Task.order 추가");
  }
  if (!existingCols.includes('archivedAt')) {
    await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`);
    console.log("✅ Task.archivedAt 추가");
  }
  if (!existingCols.includes('projectId')) {
    // projectId는 NOT NULL이지만 기존 데이터 있으면 기본값 필요
    const projResult = await client.query(`SELECT id FROM "Project" LIMIT 1`);
    const defaultProjId = projResult.rows[0]?.id ?? null;
    if (defaultProjId) {
      await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT NOT NULL DEFAULT '${defaultProjId}'`);
      await client.query(`ALTER TABLE "Task" ALTER COLUMN "projectId" DROP DEFAULT`);
    } else {
      await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT`);
    }
    console.log("✅ Task.projectId 추가");
  }

  // TaskComment 테이블
  const tcResult = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'TaskComment'`);
  if (tcResult.rows.length === 0) {
    await client.query(`
      CREATE TABLE "TaskComment" (
        id TEXT NOT NULL,
        body TEXT NOT NULL,
        mentions TEXT[] NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "taskId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        CONSTRAINT "TaskComment_pkey" PRIMARY KEY (id)
      )
    `);
    console.log("✅ TaskComment 테이블 생성");
  } else {
    console.log("ℹ️  TaskComment 이미 존재");
  }

  // TaskHistory 테이블
  const thResult = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'TaskHistory'`);
  if (thResult.rows.length === 0) {
    await client.query(`
      CREATE TABLE "TaskHistory" (
        id TEXT NOT NULL,
        "fromStatus" "TaskStatus",
        "toStatus" "TaskStatus",
        note TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "taskId" TEXT NOT NULL,
        "actorId" TEXT NOT NULL,
        CONSTRAINT "TaskHistory_pkey" PRIMARY KEY (id)
      )
    `);
    console.log("✅ TaskHistory 테이블 생성");
  } else {
    console.log("ℹ️  TaskHistory 이미 존재");
  }

  // Notification 테이블
  const notifResult = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'Notification'`);
  if (notifResult.rows.length === 0) {
    await client.query(`
      CREATE TABLE "Notification" (
        id TEXT NOT NULL,
        type "NotificationType" NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        read BOOLEAN NOT NULL DEFAULT false,
        link TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        "taskId" TEXT,
        CONSTRAINT "Notification_pkey" PRIMARY KEY (id)
      )
    `);
    console.log("✅ Notification 테이블 생성");
  } else {
    console.log("ℹ️  Notification 이미 존재");
  }

  // CalendarEvent 새 컬럼
  const ceCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'CalendarEvent' AND column_name IN ('endAt', 'allDay', 'color', 'description')
  `);
  const existingCeCols = ceCols.rows.map((r: {column_name: string}) => r.column_name);
  if (!existingCeCols.includes('endAt')) {
    await client.query(`ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3)`);
    console.log("✅ CalendarEvent.endAt 추가");
  }
  if (!existingCeCols.includes('allDay')) {
    await client.query(`ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "allDay" BOOLEAN NOT NULL DEFAULT false`);
    console.log("✅ CalendarEvent.allDay 추가");
  }
  if (!existingCeCols.includes('color')) {
    await client.query(`ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS color TEXT`);
    console.log("✅ CalendarEvent.color 추가");
  }
  if (!existingCeCols.includes('description')) {
    await client.query(`ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS description TEXT`);
    console.log("✅ CalendarEvent.description 추가");
  }

  // ProjectFile.taskId 컬럼
  const pfCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ProjectFile' AND column_name = 'taskId'
  `);
  if (pfCols.rows.length === 0) {
    await client.query(`ALTER TABLE "ProjectFile" ADD COLUMN IF NOT EXISTS "taskId" TEXT`);
    console.log("✅ ProjectFile.taskId 추가");
  }

  await client.end();
  console.log("\n✅ 모든 테이블/컬럼 준비 완료. 이제 prisma db push 실행 가능.");
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});
