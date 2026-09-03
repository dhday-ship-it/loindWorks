import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const authorSelect = { select: { id: true, name: true, email: true } } as const;

export async function GET() {
  await requireSuperAdmin();

  const entries = await prisma.corporateLedgerEntry.findMany({
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
  const { date, description, income, expense, balance } = await request.json();

  if (!date || !description || !String(description).trim()) {
    return NextResponse.json(
      { error: "날짜와 적요는 필수입니다." },
      { status: 400 }
    );
  }
  if (balance === undefined || balance === null || balance === "") {
    return NextResponse.json({ error: "잔액은 필수입니다." }, { status: 400 });
  }

  const entry = await prisma.corporateLedgerEntry.create({
    data: {
      date: new Date(date),
      description: String(description).trim(),
      income: numOrNull(income),
      expense: numOrNull(expense),
      balance: Number(balance),
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

function numOrNull(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
