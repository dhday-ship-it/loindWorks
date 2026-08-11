import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { TAX_TYPES } from "@/lib/tax-calc";
import type { TaxType } from "@/generated/prisma/enums";

const authorSelect = { select: { id: true, name: true, email: true } } as const;
const projectSelect = { select: { id: true, name: true } } as const;

export async function GET(request: Request) {
  await requireSuperAdmin();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const records = await prisma.projectRecord.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { date: "desc" },
    include: { author: authorSelect, project: projectSelect },
  });

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      date: r.date.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireSuperAdmin();
  const body = await request.json();
  const { projectId, date, title } = body;

  if (!projectId || !date || !title || !String(title).trim()) {
    return NextResponse.json(
      { error: "프로젝트, 날짜, 제목은 필수입니다." },
      { status: 400 }
    );
  }

  const record = await prisma.projectRecord.create({
    data: {
      projectId,
      authorId: user.id,
      date: new Date(date),
      title: String(title).trim(),
      note: body.note || null,
      amount: numOrNull(body.amount),
      taxType: taxTypeOrDefault(body.taxType, "VAT_INCLUSIVE"),
      advancePayment: numOrNull(body.advancePayment),
      balance: numOrNull(body.balance),
      settled: !!body.settled,
      taxInvoiceIssued: !!body.taxInvoiceIssued,
      outsourced: !!body.outsourced,
      outsourceVendor: body.outsourceVendor || null,
      outsourceTotalAmount: numOrNull(body.outsourceTotalAmount),
      outsourceTaxType: taxTypeOrDefault(body.outsourceTaxType, "NONE"),
      outsourcePayment: numOrNull(body.outsourcePayment),
      outsourceBalanceSettled: !!body.outsourceBalanceSettled,
      outsourceTaxInvoiceIssued: !!body.outsourceTaxInvoiceIssued,
    },
    include: { author: authorSelect, project: projectSelect },
  });

  return NextResponse.json(
    {
      record: {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
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

function taxTypeOrDefault(v: unknown, fallback: TaxType): TaxType {
  return TAX_TYPES.includes(v as TaxType) ? (v as TaxType) : fallback;
}
