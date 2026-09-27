import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public — the LOIND-아티즌 order form posts here, cross-origin, with no login.
// Payment isn't wired up yet: every order is created straight into PAID status.
// When a real payment gateway is added, insert its confirmation step before this
// create() call instead of trusting the client.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    workId,
    customerName,
    customerPhone,
    customerEmail,
    churchName,
    requestText,
    size,
    referenceFileUrl,
    referenceLink,
    shootPreference,
    shootLocation,
    shootTime,
    wantsEditing,
    quantity,
    desiredDeadline,
    deliveryType,
    shippingAddress,
  } = body;

  if (!workId || !customerName || !customerPhone || !requestText) {
    return NextResponse.json(
      { error: "타입, 이름, 연락처, 요청 내용은 필수입니다." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const work = await prisma.artisanWork.findUnique({ where: { id: workId } });
  if (!work) {
    return NextResponse.json({ error: "존재하지 않는 타입입니다." }, { status: 404, headers: CORS_HEADERS });
  }

  const resolvedDeliveryType = deliveryType === "PHYSICAL" && work.supportsPrint ? "PHYSICAL" : "DIGITAL";
  if (resolvedDeliveryType === "PHYSICAL" && !shippingAddress) {
    return NextResponse.json(
      { error: "실물 배송을 원하시면 배송지를 입력해주세요." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const order = await prisma.artisanOrder.create({
    data: {
      workId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      churchName: churchName || null,
      requestText,
      size: size || null,
      referenceFileUrl: referenceFileUrl || null,
      referenceLink: referenceLink || null,
      shootPreference: shootPreference || null,
      shootLocation: shootLocation || null,
      shootTime: shootTime || null,
      wantsEditing: wantsEditing === true,
      quantity: quantity || null,
      desiredDeadline: desiredDeadline || null,
      deliveryType: resolvedDeliveryType,
      shippingAddress: resolvedDeliveryType === "PHYSICAL" ? shippingAddress : null,
    },
  });

  return NextResponse.json({ order }, { status: 201, headers: CORS_HEADERS });
}
