import type { AiRecommendationsInput, AiRecommendationsOutput } from "@/lib/validation/ai-recommendations";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export async function upsertCampaignAnalysisAiMetadata(input: {
  campaignId: string;
  aiInput: AiRecommendationsInput;
  aiOutput: AiRecommendationsOutput;
}) {
  const supabase = createAdminSupabaseClient();

  const { data: existing, error: lookupError } = await supabase
    .from("analysis_results")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .eq("analysis_scope", "campaign")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const payload = {
    ai_recommendations_json: input.aiOutput,
    fallback_used: input.aiOutput.fallbackUsed,
    prompt_version: input.aiOutput.promptVersion,
    ai_generated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("analysis_results")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .insert({
      campaign_id: input.campaignId,
      submission_id: null,
      analysis_scope: "campaign",
      section_summary_json: input.aiInput.sections,
      critical_items_json: input.aiInput.criticalItems,
      classification_version: "v1",
      ...payload
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}
