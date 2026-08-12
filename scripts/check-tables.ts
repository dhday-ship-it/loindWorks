import * as dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

async function main() {
  await client.connect();
  const r = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  console.log("현재 테이블 목록:");
  console.log(r.rows.map((x: { tablename: string }) => x.tablename).join("\n"));
  await client.end();
}

main().catch(console.error);
