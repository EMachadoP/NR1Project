import type { PortalSession } from "@/lib/auth/session";
import { filterCampaignsBySessionScope } from "@/lib/auth/authorization";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export async function listCampaigns() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, sector, unit, status, start_date, end_date, language")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listCampaignsBySessionScope(session: PortalSession) {
  const campaigns = await listCampaigns();
  return filterCampaignsBySessionScope(session, campaigns);
}

export async function getCampaign(campaignId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, sector, unit, status, start_date, end_date, language, questionnaire_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listAccessibleCampaignIds(session: PortalSession) {
  const campaigns = await listCampaignsBySessionScope(session);
  return campaigns.map((campaign) => campaign.id);
}
