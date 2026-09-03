import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { LoanAdvanceType } from "@/generated/prisma/enums";

const authorSelect = { select: { id: true, name: true, email: true } } as const;
const LOAN_ADVANCE_TYPES: LoanAdvanceType[] = ["LOAN", "ADVANCE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const body = await request.json();

  if (!body.counterparty || !String(body.counterparty).trim()) {
    return NextResponse.json({ error: "성명/거래처는 필수입니다." }, { status: 400 });
  }
  if (body.type !== undefined && !LOAN_ADVANCE_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "잘못된 구분값입니다." }, { status: 400 });
  }
  if (body.amount === undefined || body.amount === null || body.amount === "") {
    return NextResponse.json({ error: "지급액은 필수입니다." }, { status: 400 });
  }

  const entry = await prisma.loanAdvanceEntry.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      type: body.type,
      counterparty: String(body.counterparty).trim(),
      amount: Number(body.amount),
      repaid:
        body.repaid === undefined || body.repaid === null || body.repaid === ""
          ? 0
          : Number(body.repaid),
      note: body.note || null,
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

  await prisma.loanAdvanceEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
