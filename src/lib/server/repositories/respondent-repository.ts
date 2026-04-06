import type { QuestionRiskInput } from "@/lib/domain/risk/types";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { hashAnonymousToken } from "@/lib/server/crypto";

export type PublicQuestionnairePayload = {
  campaign: {
    id: string;
    name: string;
    language: string;
  };
  questionnaire: {
    id: string;
    name: string;
    version: string;
  };
  sections: Array<{
    id: string;
    name: string;
    orderIndex: number;
    questions: Array<{
      id: string;
      prompt: string;
      answerType: string;
      orderIndex: number;
      isRequired: boolean;
    }>;
  }>;
  questionRiskInputs: QuestionRiskInput[];
  tokenId: string;
};

export async function findActiveTokenBundle(rawToken: string): Promise<PublicQuestionnairePayload | null> {
  const supabase = createAdminSupabaseClient();
  const tokenHash = hashAnonymousToken(rawToken);

  const { data: token, error: tokenError } = await supabase
    .from("campaign_tokens")
    .select("id, campaign_id, status, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    throw tokenError;
  }

  if (!token || token.status !== "available" || token.used_at || new Date(token.expires_at).getTime() <= Date.now()) {
    return null;
  }

  const { data: existingSubmission } = await supabase
    .from("survey_submissions")
    .select("id")
    .eq("token_id", token.id)
    .maybeSingle();

  if (existingSubmission) {
    return null;
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, language, questionnaire_id")
    .eq("id", token.campaign_id)
    .maybeSingle();

  if (campaignError) {
    throw campaignError;
  }

  if (!campaign) {
    return null;
  }

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("id, name, version")
    .eq("id", campaign.questionnaire_id)
    .maybeSingle();

  const { data: sections, error: sectionsError } = await supabase
    .from("questionnaire_sections")
    .select("id, name, order_index")
    .eq("questionnaire_id", campaign.questionnaire_id)
    .order("order_index", { ascending: true });

  if (sectionsError) {
    throw sectionsError;
  }

  const sectionIds = (sections ?? []).map((section) => section.id);

  const { data: questions, error: questionsError } = await supabase
    .from("questionnaire_questions")
    .select("id, section_id, prompt, answer_type, order_index, is_required, scoring_direction, weight, is_active")
    .in("section_id", sectionIds.length > 0 ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (questionsError) {
    throw questionsError;
  }

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      language: campaign.language
    },
    questionnaire: {
      id: questionnaire?.id ?? campaign.questionnaire_id,
      name: questionnaire?.name ?? "Questionario",
      version: questionnaire?.version ?? "v1"
    },
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      name: section.name,
      orderIndex: section.order_index,
      questions: (questions ?? [])
        .filter((question) => question.section_id === section.id)
        .map((question) => ({
          id: question.id,
          prompt: question.prompt,
          answerType: question.answer_type,
          orderIndex: question.order_index,
          isRequired: question.is_required
        }))
    })),
    questionRiskInputs: (questions ?? []).map((question) => ({
      questionId: question.id,
      sectionId: question.section_id,
      answer: null,
      scoringDirection: question.scoring_direction,
      weight: Number(question.weight ?? 1),
      isRequired: question.is_required
    })),
    tokenId: token.id
  };
}
