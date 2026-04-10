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

export async function createCampaign(data: {
  name: string;
  questionnaire_id: string;
  start_date: string;
  end_date: string;
  sector?: string | null;
  unit?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name: data.name,
      questionnaire_id: data.questionnaire_id,
      start_date: data.start_date,
      end_date: data.end_date,
      sector: data.sector ?? null,
      unit: data.unit ?? null,
      status: "draft",
      language: "pt-BR"
    })
    .select("id, name, status")
    .single();

  if (error) {
    throw error;
  }

  return campaign;
}

export async function deleteCampaign(campaignId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("NOT_FOUND");
  }
}
