import type { TaxType } from "@/generated/prisma/enums";

export interface TaxBreakdown {
  supply: number;
  vat: number;
  withholding: number;
  total: number;
  net: number;
}

export function calcTax(amount: number | null, taxType: TaxType): TaxBreakdown {
  const a = amount ?? 0;

  if (taxType === "VAT_EXCLUSIVE") {
    const vat = Math.round(a * 0.1);
    return { supply: a, vat, withholding: 0, total: a + vat, net: a + vat };
  }
  if (taxType === "VAT_INCLUSIVE") {
    const supply = Math.round(a / 1.1);
    const vat = a - supply;
    return { supply, vat, withholding: 0, total: a, net: a };
  }
  if (taxType === "WITHHOLD_3_3") {
    const withholding = Math.round(a * 0.033);
    return { supply: a, vat: 0, withholding, total: a, net: a - withholding };
  }
  return { supply: a, vat: 0, withholding: 0, total: a, net: a };
}

export const TAX_TYPE_LABEL: Record<TaxType, string> = {
  VAT_EXCLUSIVE: "VAT 별도 (+10%)",
  VAT_INCLUSIVE: "VAT 포함",
  WITHHOLD_3_3: "3.3% 원천징수",
  NONE: "해당없음",
};

export const TAX_TYPES: TaxType[] = [
  "VAT_INCLUSIVE",
  "VAT_EXCLUSIVE",
  "WITHHOLD_3_3",
  "NONE",
];
