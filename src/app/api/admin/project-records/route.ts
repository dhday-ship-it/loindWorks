import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { TAX_TYPES } from "@/lib/tax-calc";
import type { TaxType } from "@/generated/prisma/enums";

const authorSelect = { select: { id: true, name: true, email: true } } as const;
const projectSelect = { select: { id: true, name: true } } as const;
const outsourcesSelect = {
  orderBy: { createdAt: "asc" as const },
} as const;

interface OutsourceInput {
  vendor?: string;
  totalAmount?: unknown;
  taxType?: unknown;
  payment?: unknown;
  balanceSettled?: unknown;
  taxInvoiceIssued?: unknown;
}

function numOrNull(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function taxTypeOrDefault(v: unknown, fallback: TaxType): TaxType {
  return TAX_TYPES.includes(v as TaxType) ? (v as TaxType) : fallback;
}

function parseOutsources(input: unknown) {
  if (!Array.isArray(input)) return [];
  return (input as OutsourceInput[])
    .filter((o) => o && o.vendor && String(o.vendor).trim())
    .map((o) => ({
      vendor: String(o.vendor).trim(),
      totalAmount: numOrNull(o.totalAmount),
      taxType: taxTypeOrDefault(o.taxType, "NONE"),
      payment: numOrNull(o.payment),
      balanceSettled: !!o.balanceSettled,
      taxInvoiceIssued: !!o.taxInvoiceIssued,
    }));
}

export async function GET(request: Request) {
  await requireSuperAdmin();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const records = await prisma.projectRecord.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { date: "desc" },
    include: {
      author: authorSelect,
      project: projectSelect,
      outsources: outsourcesSelect,
    },
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
      outsources: { create: parseOutsources(body.outsources) },
    },
    include: {
      author: authorSelect,
      project: projectSelect,
      outsources: outsourcesSelect,
    },
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
