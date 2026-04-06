import { buildReceiptExpiresAt } from "@/lib/domain/receipts/policy";
import { redactAnonymousObservationText } from "@/lib/domain/anonymity/policy";
import { consolidateCampaignRisk, consolidateResponseRisk } from "@/lib/domain/risk/engine";
import type { QuestionRiskInput } from "@/lib/domain/risk/types";
import { createReceiptCode } from "@/lib/server/crypto";
import { getCampaignDashboardSummary, listResponseRiskInputsByCampaign } from "@/lib/server/repositories/analytics-repository";
import { findActiveTokenBundle } from "@/lib/server/repositories/respondent-repository";
import { enqueueIndividualReport } from "@/lib/server/services/report-service";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { anonymousSubmissionSchema, type AnonymousSubmissionInput } from "@/lib/validation/submission";
import { randomUUID } from "node:crypto";

function mapInputsForSubmission(metadata: QuestionRiskInput[], submission: AnonymousSubmissionInput) {
  const answerMap = new Map(submission.answers.map((answer) => [answer.questionId, answer.answerRaw]));

  return metadata.map((item) => ({
    ...item,
    answer: answerMap.get(item.questionId) ?? null
  }));
}

export async function getRespondentQuestionnaire(rawToken: string) {
  const bundle = await findActiveTokenBundle(rawToken);

  if (!bundle) {
    return null;
  }

  return {
    campaign: bundle.campaign,
    questionnaire: bundle.questionnaire,
    sections: bundle.sections
  };
}

export async function submitAnonymousResponse(input: AnonymousSubmissionInput) {
  const parsed = anonymousSubmissionSchema.parse(input);
  const bundle = await findActiveTokenBundle(parsed.token);

  if (!bundle) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  const riskInputs = mapInputsForSubmission(bundle.questionRiskInputs, parsed);
  const responseSummary = consolidateResponseRisk(riskInputs);
  const supabase = createAdminSupabaseClient();
  const submissionId = randomUUID();
  const receiptCode = createReceiptCode();
  const receiptExpiresAt = buildReceiptExpiresAt();
  const safeObservationText = redactAnonymousObservationText(parsed.observationText ?? null);

  const { error: submissionError } = await supabase.from("survey_submissions").insert({
    id: submissionId,
    campaign_id: bundle.campaign.id,
    token_id: bundle.tokenId,
    mode: "anonymous",
    observation_text: safeObservationText,
    receipt_code: receiptCode,
    receipt_expires_at: receiptExpiresAt,
    analysis_version: "v1"
  });

  if (submissionError) throw submissionError;

  const answerRows = responseSummary.sectionSummaries.flatMap((section) =>
    section.items.map((item) => ({
      submission_id: submissionId,
      question_id: item.questionId,
      answer_raw: item.answer,
      risk_value: item.riskValue
    }))
  );

  const { error: answersError } = await supabase.from("submission_answers").insert(answerRows);
  if (answersError) throw answersError;

  const { error: analysisError } = await supabase.from("analysis_results").insert({
    campaign_id: bundle.campaign.id,
    submission_id: submissionId,
    analysis_scope: "submission",
    section_summary_json: responseSummary.sectionSummaries,
    critical_items_json: responseSummary.criticalItems,
    classification_version: "v1"
  });
  if (analysisError) throw analysisError;

  const { error: tokenError } = await supabase
    .from("campaign_tokens")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", bundle.tokenId)
    .eq("status", "available")
    .is("used_at", null);

  if (tokenError) throw tokenError;

  const campaignResponses = await listResponseRiskInputsByCampaign(bundle.campaign.id);
  const campaignSummary = consolidateCampaignRisk(campaignResponses);

  await supabase.from("analysis_results").delete().eq("campaign_id", bundle.campaign.id).eq("analysis_scope", "campaign");
  await supabase.from("analysis_results").insert({
    campaign_id: bundle.campaign.id,
    submission_id: null,
    analysis_scope: "campaign",
    section_summary_json: campaignSummary.sectionSummaries,
    critical_items_json: campaignSummary.criticalItems,
    classification_version: "v1"
  });

  let reportRequestId: string | null = null;
  let reportStatus: "pending" | "failed" = "pending";

  try {
    const pendingReport = await enqueueIndividualReport(submissionId);
    reportRequestId = pendingReport.id;
  } catch {
    reportStatus = "failed";
  }

  return {
    receiptCode,
    receiptExpiresAt,
    reportRequestId,
    reportStatus,
    responseSummary,
    campaignSummary
  };
}

export async function getCampaignSummary(campaignId: string) {
  return getCampaignDashboardSummary(campaignId);
}
