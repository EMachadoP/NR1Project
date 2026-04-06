import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import { requestPasswordResetSchema, signInSchema } from "@/lib/validation/auth";

function resolveAppOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signInAction(formData: FormData) {
  "use server";

  const parsed = signInSchema.parse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/campanhas");
}

export async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const parsed = requestPasswordResetSchema.parse({
    email: formData.get("email")
  });

  const supabase = await createServerSupabaseClient();
  const headerStore = await headers();
  const redirectTo = `${resolveAppOrigin(headerStore)}/auth/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, { redirectTo });

  if (error) {
    redirect(`/login/forgot-password?error=${encodeURIComponent(error.message)}` as never);
  }

  redirect(`/login/forgot-password?sent=1&email=${encodeURIComponent(parsed.email)}` as never);
}

export async function signOutAction() {
  "use server";
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
