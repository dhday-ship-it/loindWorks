import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

// PM 또는 SUPER_ADMIN
export async function requirePM() {
  const user = await requireUser();
  if (user.role !== "PM" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

// STAFF, PM, SUPER_ADMIN 모두 허용
export async function requireStaff() {
  const user = await requireUser();
  if (
    user.role !== "STAFF" &&
    user.role !== "PM" &&
    user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }
  return user;
}
