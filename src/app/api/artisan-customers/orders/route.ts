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

// 로그인해서 접수한 주문(customerId 매칭)뿐 아니라, 로그인 기능이 생기기 전에
// 비로그인으로 접수했던 주문도 이메일·연락처가 같으면 함께 보여준다.
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

  const orders = await prisma.artisanOrder.findMany({
    where: {
      OR: [
        { customerId: customer.id },
        { customerEmail: customer.email },
        { customerPhone: customer.phone },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, category: true, imageUrl: true } },
    },
  });

  return NextResponse.json({ orders }, { headers: CORS_HEADERS });
}
