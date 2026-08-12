import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI(db push/migrate)는 direct connection 사용
// 런타임 PrismaClient는 src/lib/prisma.ts에서 pooler URL 사용
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
