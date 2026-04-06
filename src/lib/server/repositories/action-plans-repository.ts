import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import type { ActionPlanInput, ActionPlanPatchInput } from "@/lib/validation/action-plan";

export async function listActionPlans(campaignIds?: string[]) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("action_plans")
    .select("id, campaign_id, risk_identified, section_name, root_cause, measure, owner_name, due_date, status, origin, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (campaignIds) {
    if (campaignIds.length === 0) {
      return [];
    }

    query = query.in("campaign_id", campaignIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createActionPlan(input: ActionPlanInput, actorId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("action_plans")
    .insert({
      campaign_id: input.campaignId,
      risk_identified: input.riskIdentified,
      section_name: input.sectionName ?? null,
      root_cause: input.rootCause ?? null,
      measure: input.measure,
      owner_name: input.ownerName ?? null,
      due_date: input.dueDate ?? null,
      status: input.status,
      origin: input.origin,
      created_by: actorId,
      updated_by: actorId
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getActionPlanById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("action_plans").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateActionPlan(input: ActionPlanPatchInput, actorId: string) {
  const supabase = createAdminSupabaseClient();
  const payload: Record<string, unknown> = { updated_by: actorId };

  if (input.campaignId) payload.campaign_id = input.campaignId;
  if (input.riskIdentified !== undefined) payload.risk_identified = input.riskIdentified;
  if (input.sectionName !== undefined) payload.section_name = input.sectionName;
  if (input.rootCause !== undefined) payload.root_cause = input.rootCause;
  if (input.measure !== undefined) payload.measure = input.measure;
  if (input.ownerName !== undefined) payload.owner_name = input.ownerName;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate;
  if (input.status !== undefined) payload.status = input.status;
  if (input.origin !== undefined) payload.origin = input.origin;

  const { data, error } = await supabase.from("action_plans").update(payload).eq("id", input.id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteActionPlan(id: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("action_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function createActionPlanHistory(actionPlanId: string, actorId: string, beforeJson: unknown, afterJson: unknown) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("action_plan_history").insert({
    action_plan_id: actionPlanId,
    changed_by: actorId,
    before_json: beforeJson,
    after_json: afterJson
  });

  if (error) throw error;
}

export async function createAuditLog(params: {
  actorId: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    actor_role: params.actorRole,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    before_json: params.beforeJson ?? null,
    after_json: params.afterJson ?? null
  });

  if (error) throw error;
}
