import { assertCampaignScope, assertRole } from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/server/audit/logging";
import { getCampaign, listAccessibleCampaignIds } from "@/lib/server/repositories/campaigns-repository";
import { createIndicator, deleteIndicator, getIndicatorById, listIndicators, updateIndicator } from "@/lib/server/repositories/indicators-repository";
import { indicatorPatchSchema, indicatorSchema } from "@/lib/validation/indicator";

export async function listIndicatorsService(actor: PortalSession, campaignId?: string) {
  if (campaignId) {
    const campaign = await getCampaign(campaignId);
    assertCampaignScope(actor, campaign);
    return listIndicators([campaignId]);
  }

  const accessibleCampaignIds = await listAccessibleCampaignIds(actor);
  return listIndicators(accessibleCampaignIds);
}

export async function createIndicatorService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const parsed = indicatorSchema.parse(input);
  const campaign = await getCampaign(parsed.campaignId);
  assertCampaignScope(actor, campaign);
  const created = await createIndicator(parsed, actor.userId);

  await writeAuditLog({
    actor,
    entityType: "indicator",
    entityId: created.id,
    action: "create",
    afterJson: created
  });

  return created;
}

export async function updateIndicatorService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const parsed = indicatorPatchSchema.parse(input);
  const before = await getIndicatorById(parsed.id);
  if (!before) {
    throw new Error("NOT_FOUND");
  }

  const currentCampaign = await getCampaign(before.campaign_id);
  assertCampaignScope(actor, currentCampaign);

  if (parsed.campaignId) {
    const targetCampaign = await getCampaign(parsed.campaignId);
    assertCampaignScope(actor, targetCampaign);
  }

  const updated = await updateIndicator(parsed, actor.userId);

  await writeAuditLog({
    actor,
    entityType: "indicator",
    entityId: parsed.id,
    action: "update",
    beforeJson: before,
    afterJson: updated
  });

  return updated;
}

export async function deleteIndicatorService(id: string, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const before = await getIndicatorById(id);
  if (!before) {
    throw new Error("NOT_FOUND");
  }

  const campaign = await getCampaign(before.campaign_id);
  assertCampaignScope(actor, campaign);
  await deleteIndicator(id);

  await writeAuditLog({
    actor,
    entityType: "indicator",
    entityId: id,
    action: "delete",
    beforeJson: before
  });
}
