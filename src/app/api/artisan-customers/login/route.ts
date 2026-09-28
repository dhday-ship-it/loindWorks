import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { signCustomerToken } from "@/lib/artisan-customer-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "이메일과 비밀번호를 입력해주세요." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const customer = await prisma.artisanCustomer.findUnique({ where: { email } });
  const valid = customer ? await bcrypt.compare(password, customer.passwordHash) : false;
  if (!customer || !valid) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const token = signCustomerToken(customer.id);
  return NextResponse.json(
    {
      token,
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
