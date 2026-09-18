import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { getHomeData } from "@/lib/staff-home-data";

export async function GET() {
  const user = await requireStaff();
  const data = await getHomeData(user.id, user.role);
  return NextResponse.json(data);
}
