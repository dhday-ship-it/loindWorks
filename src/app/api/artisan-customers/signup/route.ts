import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { signCustomerToken } from "@/lib/artisan-customer-auth";

// Public — LOIND-아티즌 사이트의 고객(교회/단체/개인) 회원가입.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const { email, password, name, phone, churchName } = await request.json();

  if (!email || !password || !name || !phone || !churchName) {
    return NextResponse.json(
      { error: "소속, 이메일, 비밀번호, 이름, 연락처는 필수입니다." },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const existing = await prisma.artisanCustomer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await prisma.artisanCustomer.create({
    data: { email, passwordHash, name, phone, churchName },
  });

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
    { status: 201, headers: CORS_HEADERS },
  );
}
