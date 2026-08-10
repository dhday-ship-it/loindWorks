import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();

  const contacts = await prisma.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    contacts: contacts.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
