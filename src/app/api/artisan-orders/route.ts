import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getBearerToken, verifyCustomerToken } from "@/lib/artisan-customer-auth";
import { sendMail } from "@/lib/mail";

// Public — the LOIND-아티즌 order form posts here, cross-origin. Login is optional:
// if a valid customer token is attached, the order is linked to that account so it
// shows up in "내 의뢰 내역"; otherwise it's still accepted as a guest order.
// Payment isn't wired up yet: every order is created straight into PAID status.
// When a real payment gateway is added, insert its confirmation step before this
// create() call instead of trusting the client.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  const token = getBearerToken(request);
  const customerId = token ? verifyCustomerToken(token) : null;

  const order = await prisma.artisanOrder.create({
    data: {
      workId,
      customerId: customerId || undefined,
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
    include: {
      assignedStaff: { select: { email: true } },
    },
  });

  await notifyNewOrder(order, work);

  return NextResponse.json({ order }, { status: 201, headers: CORS_HEADERS });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function notifyNewOrder(
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    churchName: string | null;
    requestText: string;
    assignedStaff: { email: string } | null;
  },
  work: { category: string; title: string },
) {
  const to = order.assignedStaff?.email || process.env.ORDER_NOTIFY_FALLBACK_EMAIL;
  if (!to) return;

  const churchSuffix = order.churchName ? ` (${escapeHtml(order.churchName)})` : "";

  await sendMail({
    to,
    subject: `[아티즌] 새 의뢰 접수 — ${work.category} · ${work.title}`,
    html: `
      <p>새 아티즌 의뢰가 접수됐어요.</p>
      <ul>
        <li>카테고리 / 타입: ${escapeHtml(work.category)} · ${escapeHtml(work.title)}</li>
        <li>고객명: ${escapeHtml(order.customerName)}${churchSuffix}</li>
        <li>연락처: ${escapeHtml(order.customerPhone)}</li>
        <li>이메일: ${order.customerEmail ? escapeHtml(order.customerEmail) : "-"}</li>
        <li>요청 내용: ${escapeHtml(order.requestText).replace(/\n/g, "<br>")}</li>
      </ul>
      <p>로인드웍스 → Artisan 메뉴에서 상태를 확인하고 담당자를 지정해주세요.</p>
    `,
  });
}
