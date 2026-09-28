import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getBearerToken, verifyCustomerToken } from "@/lib/artisan-customer-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const customerId = token ? verifyCustomerToken(token) : null;
  if (!customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401, headers: CORS_HEADERS });
  }

  const customer = await prisma.artisanCustomer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "존재하지 않는 계정입니다." }, { status: 401, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        churchName: customer.churchName,
      },
    },
    { headers: CORS_HEADERS },
  );
}
