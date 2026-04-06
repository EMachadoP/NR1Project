import { getEnv } from "@/lib/validation/env";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export const REPORT_SIGNED_URL_TTL_SECONDS = 3600;

export async function uploadReportArtifact(path: string, html: string) {
  const supabase = createAdminSupabaseClient();
  const env = getEnv();
  const payload = new Blob([html], { type: "text/html;charset=utf-8" });

  const { error } = await supabase.storage.from(env.REPORTS_BUCKET).upload(path, payload, {
    upsert: true,
    contentType: "text/html;charset=utf-8"
  });

  if (error) throw error;
  return path;
}

export async function createSignedReportUrl(path: string, expiresIn = REPORT_SIGNED_URL_TTL_SECONDS) {
  const supabase = createAdminSupabaseClient();
  const env = getEnv();
  const { data, error } = await supabase.storage.from(env.REPORTS_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
