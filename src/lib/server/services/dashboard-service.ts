import { assertCampaignScope } from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";
import { getCampaign, listCampaignsBySessionScope } from "@/lib/server/repositories/campaigns-repository";
import { getCampaignDashboardSummary } from "@/lib/server/repositories/analytics-repository";

export async function listCampaignsService(actor: PortalSession) {
  return listCampaignsBySessionScope(actor);
}

export async function getCampaignDashboardService(campaignId: string, actor: PortalSession) {
  const campaign = await getCampaign(campaignId);
  const accessibleCampaign = assertCampaignScope(actor, campaign);
  const summary = await getCampaignDashboardSummary(campaignId);

  return {
    campaign: accessibleCampaign,
    summary
  };
}
