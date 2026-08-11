import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { getStaffHomeData } from "@/lib/staff-home-data";

export async function GET() {
  const user = await requireStaff();
  const data = await getStaffHomeData(user.id);
  return NextResponse.json(data);
}
