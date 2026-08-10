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

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireClient() {
  const user = await requireUser();
  if (user.role !== "CLIENT") {
    redirect("/dashboard");
  }
  return user;
}
