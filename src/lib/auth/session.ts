export type PortalRole = "admin" | "hr" | "manager";

export type PortalSession = {
  userId: string;
  email: string | null;
  role: PortalRole;
  displayName: string | null;
  sector: string | null;
  unit: string | null;
};

import { redirect } from "next/navigation";
import { assertRole } from "@/lib/auth/authorization";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

export async function getPortalSession(): Promise<PortalSession | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Use admin client so the profile query bypasses RLS and PostgREST schema
  // cache issues — profile data is trusted server-side only.
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role, display_name, sector, unit")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (profile?.role ?? "hr") as PortalRole,
    displayName: profile?.display_name ?? null,
    sector: profile?.sector ?? null,
    unit: profile?.unit ?? null
  };
}

export async function requirePortalSession(allowedRoles?: PortalRole[]) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  if (allowedRoles?.length) {
    assertRole(session, allowedRoles);
  }

  return session;
}

export async function requirePortalApiSession(allowedRoles?: PortalRole[]) {
  const session = await getPortalSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (allowedRoles?.length) {
    assertRole(session, allowedRoles);
  }

  return session;
}
