import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const authorSelect = { select: { id: true, name: true, email: true } } as const;

function numOrNull(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const body = await request.json();

  if (!body.description || !String(body.description).trim()) {
    return NextResponse.json({ error: "적요는 필수입니다." }, { status: 400 });
  }
  if (body.balance === undefined || body.balance === null || body.balance === "") {
    return NextResponse.json({ error: "잔액은 필수입니다." }, { status: 400 });
  }

  const entry = await prisma.corporateLedgerEntry.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      description: String(body.description).trim(),
      income: numOrNull(body.income),
      expense: numOrNull(body.expense),
      balance: Number(body.balance),
    },
    include: { author: authorSelect },
  });

  return NextResponse.json({
    entry: {
      ...entry,
      date: entry.date.toISOString(),
      createdAt: entry.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.corporateLedgerEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
