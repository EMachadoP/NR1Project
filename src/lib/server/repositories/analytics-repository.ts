import { consolidateCampaignRisk, consolidateResponseRisk } from "@/lib/domain/risk/engine";
import type { QuestionRiskInput, ResponseRiskSummary } from "@/lib/domain/risk/types";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export const MIN_ANONYMITY_GROUP_SIZE = 5;

export type CampaignDashboardSummary = {
  responseCount: number;
  criticalItems: ResponseRiskSummary["criticalItems"];
  sectionSummaries: ReturnType<typeof consolidateCampaignRisk>["sectionSummaries"];
  anonymity: {
    minimumGroupSize: number;
    blocked: boolean;
    reason: string | null;
  };
};

export async function listResponseRiskInputsByCampaign(campaignId: string): Promise<ResponseRiskSummary[]> {
  const supabase = createAdminSupabaseClient();

  const { data: answers, error } = await supabase
    .from("submission_answers")
    .select(`
      submission_id,
      question_id,
      answer_raw,
      questionnaire_questions!inner(section_id, scoring_direction, weight),
      survey_submissions!inner(campaign_id)
    `)
    .eq("survey_submissions.campaign_id", campaignId);

  if (error) {
    throw error;
  }

  const grouped = new Map<string, QuestionRiskInput[]>();

  for (const row of answers ?? []) {
    const question = Array.isArray(row.questionnaire_questions) ? row.questionnaire_questions[0] : row.questionnaire_questions;
    if (!question) {
      continue;
    }

    const list = grouped.get(row.submission_id) ?? [];
    list.push({
      questionId: row.question_id,
      sectionId: question.section_id,
      answer: row.answer_raw,
      scoringDirection: question.scoring_direction,
      weight: Number(question.weight ?? 1),
      isRequired: true
    });
    grouped.set(row.submission_id, list);
  }

  return Array.from(grouped.values()).map(consolidateResponseRisk);
}

export async function getCampaignDashboardSummary(campaignId: string): Promise<CampaignDashboardSummary> {
  const responses = await listResponseRiskInputsByCampaign(campaignId);

  if (responses.length === 0) {
    return {
      responseCount: 0,
      criticalItems: [],
      sectionSummaries: [],
      anonymity: {
        minimumGroupSize: MIN_ANONYMITY_GROUP_SIZE,
        blocked: true,
        reason: "Grupo insuficiente para exibicao consolidada."
      }
    };
  }

  if (responses.length < MIN_ANONYMITY_GROUP_SIZE) {
    return {
      responseCount: responses.length,
      criticalItems: [],
      sectionSummaries: [],
      anonymity: {
        minimumGroupSize: MIN_ANONYMITY_GROUP_SIZE,
        blocked: true,
        reason: `Grupo com menos de ${MIN_ANONYMITY_GROUP_SIZE} respostas. Exibicao consolidada bloqueada para preservar anonimato.`
      }
    };
  }

  const consolidated = consolidateCampaignRisk(responses);

  return {
    ...consolidated,
    anonymity: {
      minimumGroupSize: MIN_ANONYMITY_GROUP_SIZE,
      blocked: false,
      reason: null
    }
  };
}
