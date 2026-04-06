import { assertCampaignScope, assertRole } from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/server/audit/logging";
import {
  createActionPlan,
  createActionPlanHistory,
  deleteActionPlan,
  getActionPlanById,
  listActionPlans,
  updateActionPlan
} from "@/lib/server/repositories/action-plans-repository";
import { getCampaign, listAccessibleCampaignIds } from "@/lib/server/repositories/campaigns-repository";
import { actionPlanPatchSchema, actionPlanSchema } from "@/lib/validation/action-plan";

export async function listActionPlansService(actor: PortalSession, campaignId?: string) {
  if (campaignId) {
    const campaign = await getCampaign(campaignId);
    assertCampaignScope(actor, campaign);
    return listActionPlans([campaignId]);
  }

  const accessibleCampaignIds = await listAccessibleCampaignIds(actor);
  return listActionPlans(accessibleCampaignIds);
}

export async function createActionPlanService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const parsed = actionPlanSchema.parse(input);
  const campaign = await getCampaign(parsed.campaignId);
  assertCampaignScope(actor, campaign);
  const created = await createActionPlan(parsed, actor.userId);

  await writeAuditLog({
    actor,
    entityType: "action_plan",
    entityId: created.id,
    action: "create",
    afterJson: created
  });

  return created;
}

export async function updateActionPlanService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const parsed = actionPlanPatchSchema.parse(input);
  const before = await getActionPlanById(parsed.id);
  if (!before) {
    throw new Error("NOT_FOUND");
  }

  const currentCampaign = await getCampaign(before.campaign_id);
  assertCampaignScope(actor, currentCampaign);

  if (parsed.campaignId) {
    const targetCampaign = await getCampaign(parsed.campaignId);
    assertCampaignScope(actor, targetCampaign);
  }

  const updated = await updateActionPlan(parsed, actor.userId);

  await createActionPlanHistory(parsed.id, actor.userId, before, updated);
  await writeAuditLog({
    actor,
    entityType: "action_plan",
    entityId: parsed.id,
    action: "update",
    beforeJson: before,
    afterJson: updated
  });

  return updated;
}

export async function deleteActionPlanService(id: string, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const before = await getActionPlanById(id);
  if (!before) {
    throw new Error("NOT_FOUND");
  }

  const campaign = await getCampaign(before.campaign_id);
  assertCampaignScope(actor, campaign);
  await deleteActionPlan(id);

  await writeAuditLog({
    actor,
    entityType: "action_plan",
    entityId: id,
    action: "delete",
    beforeJson: before
  });
}
