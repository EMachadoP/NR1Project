import { randomUUID } from "node:crypto";
import { hashAnonymousToken } from "@/lib/server/crypto";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export async function generateTokens(campaignId: string, count: number, baseUrl: string) {
  const supabase = createAdminSupabaseClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const rows = Array.from({ length: count }, () => {
    const token = randomUUID();
    return { token, hash: hashAnonymousToken(token) };
  });

  const { error } = await supabase.from("campaign_tokens").insert(
    rows.map(({ hash }) => ({
      token_hash: hash,
      campaign_id: campaignId,
      expires_at: expiresAt,
      status: "available"
    }))
  );

  if (error) throw error;

  return rows.map(({ token }) => ({
    token,
    url: `${baseUrl}/responder/${token}`
  }));
}
