import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

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

export async function signOutAction() {
  "use server";
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
