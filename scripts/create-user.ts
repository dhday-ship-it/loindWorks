import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import type { Role } from "../src/generated/prisma/enums";

const VALID_ROLES: Role[] = ["SUPER_ADMIN", "BRAND_ADMIN", "STAFF", "CLIENT"];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
  };

  return {
    name: get("--name"),
    email: get("--email"),
    password: get("--password"),
    role: (get("--role")?.toUpperCase() ?? "STAFF") as Role,
  };
}

async function main() {
  const { name, email, password, role } = parseArgs();

  if (!email || !password) {
    console.error(
      "사용법: npm run create-user -- --name 이름 --email you@example.com --password 12345678 --role STAFF"
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("비밀번호는 8자 이상이어야 합니다.");
    process.exitCode = 1;
    return;
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`role은 다음 중 하나여야 합니다: ${VALID_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: { name: name || undefined, email, passwordHash, role },
    update: { name: name || undefined, passwordHash, role },
    select: { id: true, email: true, role: true },
  });

  console.log("계정이 생성/갱신되었습니다:", user);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
