import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Requires an authenticated user session. Redirects to /login if not authenticated.
 * Use this for pages that any authenticated user can access regardless of role.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Requires the user to be a SUPER_ADMIN. Redirects to /dashboard otherwise.
 * Use this for admin-only pages and API routes.
 */
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Permits all authenticated roles (STAFF, SUPER_ADMIN).
 *
 * Functionally equivalent to `requireUser()` — every authenticated user has
 * staff-level access. It exists as a semantic boundary: if a role is added in
 * the future that should NOT have staff-level access (e.g., CLIENT, VIEWER),
 * this guard will need to be updated to exclude it.
 */
export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
