import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { LoanAdvanceType } from "@/generated/prisma/enums";

const authorSelect = { select: { id: true, name: true, email: true } } as const;
const LOAN_ADVANCE_TYPES: LoanAdvanceType[] = ["LOAN", "ADVANCE"];

export async function GET() {
  await requireSuperAdmin();

  const entries = await prisma.loanAdvanceEntry.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: { author: authorSelect },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireSuperAdmin();
  const { date, type, counterparty, amount, repaid, note } = await request.json();

  if (!date || !counterparty || !String(counterparty).trim()) {
    return NextResponse.json(
      { error: "날짜와 성명/거래처는 필수입니다." },
      { status: 400 }
    );
  }
  if (!LOAN_ADVANCE_TYPES.includes(type)) {
    return NextResponse.json({ error: "구분(대출/가지급금)은 필수입니다." }, { status: 400 });
  }
  if (amount === undefined || amount === null || amount === "") {
    return NextResponse.json({ error: "지급액은 필수입니다." }, { status: 400 });
  }

  const entry = await prisma.loanAdvanceEntry.create({
    data: {
      date: new Date(date),
      type,
      counterparty: String(counterparty).trim(),
      amount: Number(amount),
      repaid: repaid === undefined || repaid === null || repaid === "" ? 0 : Number(repaid),
      note: note || null,
      authorId: user.id,
    },
    include: { author: authorSelect },
  });

  return NextResponse.json(
    {
      entry: {
        ...entry,
        date: entry.date.toISOString(),
        createdAt: entry.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
