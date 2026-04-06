import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import type { IndicatorInput, IndicatorPatchInput } from "@/lib/validation/indicator";

export async function listIndicators(campaignIds?: string[]) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("monitoring_indicators")
    .select("id, campaign_id, period_label, indicator_name, previous_value, current_value, target_value, variation, action_needed, created_at")
    .order("created_at", { ascending: false });

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

export async function createIndicator(input: IndicatorInput, actorId: string) {
  const supabase = createAdminSupabaseClient();
  const variation = input.previousValue == null ? null : input.currentValue - input.previousValue;
  const actionNeeded = input.targetValue == null ? false : input.currentValue > input.targetValue;

  const { data, error } = await supabase
    .from("monitoring_indicators")
    .insert({
      campaign_id: input.campaignId,
      period_label: input.periodLabel,
      indicator_name: input.indicatorName,
      previous_value: input.previousValue ?? null,
      current_value: input.currentValue,
      target_value: input.targetValue ?? null,
      variation: variation,
      action_needed: actionNeeded,
      created_by: actorId
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getIndicatorById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("monitoring_indicators").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateIndicator(input: IndicatorPatchInput, actorId: string) {
  const supabase = createAdminSupabaseClient();
  const currentValue = input.currentValue ?? undefined;
  const previousValue = input.previousValue ?? undefined;
  const targetValue = input.targetValue ?? undefined;
  const variation = currentValue != null && previousValue != null ? currentValue - previousValue : null;
  const actionNeeded = currentValue != null && targetValue != null ? currentValue > targetValue : false;

  const payload: Record<string, unknown> = { updated_by: actorId };
  if (input.campaignId !== undefined) payload.campaign_id = input.campaignId;
  if (input.periodLabel !== undefined) payload.period_label = input.periodLabel;
  if (input.indicatorName !== undefined) payload.indicator_name = input.indicatorName;
  if (input.previousValue !== undefined) payload.previous_value = input.previousValue;
  if (input.currentValue !== undefined) payload.current_value = input.currentValue;
  if (input.targetValue !== undefined) payload.target_value = input.targetValue;
  if (input.currentValue !== undefined || input.previousValue !== undefined) payload.variation = variation;
  if (input.currentValue !== undefined || input.targetValue !== undefined) payload.action_needed = actionNeeded;

  const { data, error } = await supabase.from("monitoring_indicators").update(payload).eq("id", input.id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteIndicator(id: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("monitoring_indicators").delete().eq("id", id);
  if (error) throw error;
}
