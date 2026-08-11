import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { TAX_TYPES } from "@/lib/tax-calc";
import type { TaxType } from "@/generated/prisma/enums";

const authorSelect = { select: { id: true, name: true, email: true } } as const;
const projectSelect = { select: { id: true, name: true } } as const;

function numOrNull(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function taxTypeOrDefault(v: unknown, fallback: TaxType): TaxType {
  return TAX_TYPES.includes(v as TaxType) ? (v as TaxType) : fallback;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const body = await request.json();

  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "제목은 필수입니다." }, { status: 400 });
  }

  const record = await prisma.projectRecord.update({
    where: { id },
    data: {
      projectId: body.projectId || undefined,
      date: body.date ? new Date(body.date) : undefined,
      title: String(body.title).trim(),
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

  return NextResponse.json({
    record: {
      ...record,
      date: record.date.toISOString(),
      createdAt: record.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.projectRecord.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
