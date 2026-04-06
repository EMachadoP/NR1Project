import { riskClassificationScale } from "@/lib/domain/risk/engine";
import type {
  AnalyticalReportData,
  GeneratedReportStatus,
  IndividualReportData,
  PublicReceiptData,
  ReportType
} from "@/lib/domain/reports/types";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

type AnswerRow = {
  question_id: string;
  answer_raw: number;
  risk_value: number;
  questionnaire_questions:
    | {
        prompt: string;
        section_id: string;
      }
    | Array<{
        prompt: string;
        section_id: string;
      }>;
};

function buildSectionMapFromAnswers(
  answers: AnswerRow[],
  sectionSummaries: Array<{ sectionId: string; average: number; label: string }>,
  sectionNameMap: Map<string, string>
) {
  const bySection = new Map<string, { id: string; name: string; average: number; label: string; items: IndividualReportData["sections"][number]["items"] }>();

  for (const row of answers) {
    const question = Array.isArray(row.questionnaire_questions) ? row.questionnaire_questions[0] : row.questionnaire_questions;
    if (!question) {
      continue;
    }

    const sectionId = question.section_id;
    const summary = sectionSummaries.find((item) => item.sectionId === sectionId);
    const existing = bySection.get(sectionId) ?? {
      id: sectionId,
      name: sectionNameMap.get(sectionId) ?? sectionId,
      average: summary?.average ?? 0,
      label: summary?.label ?? "BAIXO",
      items: []
    };

    existing.items.push({
      questionId: row.question_id,
      prompt: question.prompt,
      answerRaw: row.answer_raw,
      riskValue: Number(row.risk_value),
      isCritical: Number(row.risk_value) >= 4
    });

    bySection.set(sectionId, existing);
  }

  return Array.from(bySection.values());
}

export async function buildIndividualReportSnapshot(submissionId: string): Promise<{ data: IndividualReportData; analysisId: string | null } | null> {
  const supabase = createAdminSupabaseClient();

  const { data: submission, error: submissionError } = await supabase
    .from("survey_submissions")
    .select("id, campaign_id, receipt_code, submitted_at, receipt_expires_at, observation_text")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError) throw submissionError;
  if (!submission) return null;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, sector, unit, language, questionnaire_id")
    .eq("id", submission.campaign_id)
    .maybeSingle();

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("id, name, version")
    .eq("id", campaign?.questionnaire_id)
    .maybeSingle();

  const { data: analysis } = await supabase
    .from("analysis_results")
    .select("id, section_summary_json")
    .eq("submission_id", submissionId)
    .eq("analysis_scope", "submission")
    .maybeSingle();

  const { data: answers, error: answersError } = await supabase
    .from("submission_answers")
    .select("question_id, answer_raw, risk_value, questionnaire_questions!inner(prompt, section_id)")
    .eq("submission_id", submissionId);

  if (answersError) throw answersError;

  const sectionIds = Array.from(
    new Set(
      (answers ?? [])
        .map((row) => {
          const question = Array.isArray(row.questionnaire_questions) ? row.questionnaire_questions[0] : row.questionnaire_questions;
          return question?.section_id ?? null;
        })
        .filter((sectionId): sectionId is string => Boolean(sectionId))
    )
  );

  const { data: sections } = await supabase
    .from("questionnaire_sections")
    .select("id, name")
    .in("id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"]);

  const sectionNameMap = new Map((sections ?? []).map((section) => [section.id, section.name]));
  const sectionSummaries = Array.isArray(analysis?.section_summary_json) ? analysis.section_summary_json : [];

  return {
    analysisId: analysis?.id ?? null,
    data: {
      campaign: {
        id: campaign?.id ?? submission.campaign_id,
        name: campaign?.name ?? "Campanha",
        sector: campaign?.sector ?? null,
        unit: campaign?.unit ?? null,
        language: campaign?.language ?? "pt-BR"
      },
      questionnaire: {
        id: questionnaire?.id ?? campaign?.questionnaire_id ?? "",
        name: questionnaire?.name ?? "Questionario",
        version: questionnaire?.version ?? "v1"
      },
      submission: {
        id: submission.id,
        receiptCode: submission.receipt_code,
        submittedAt: submission.submitted_at,
        receiptExpiresAt: submission.receipt_expires_at,
        observationText: submission.observation_text
      },
      sections: buildSectionMapFromAnswers((answers ?? []) as AnswerRow[], sectionSummaries, sectionNameMap)
    }
  };
}

export async function buildAnalyticalReportSnapshot(campaignId: string): Promise<{ data: AnalyticalReportData; analysisId: string | null } | null> {
  const supabase = createAdminSupabaseClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, sector, unit, language")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) return null;

  const { data: analysis } = await supabase
    .from("analysis_results")
    .select("id, section_summary_json, critical_items_json, created_at")
    .eq("campaign_id", campaignId)
    .eq("analysis_scope", "campaign")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: responsesCount } = await supabase
    .from("survey_submissions")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  const { data: actionPlans } = await supabase
    .from("action_plans")
    .select("id, risk_identified, section_name, measure, owner_name, due_date, status")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  const sectionTable = Array.isArray(analysis?.section_summary_json) ? analysis.section_summary_json : [];
  const criticalItems = Array.isArray(analysis?.critical_items_json) ? analysis.critical_items_json : [];
  const generatedAt = new Date().toISOString();

  return {
    analysisId: analysis?.id ?? null,
    data: {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        sector: campaign.sector,
        unit: campaign.unit,
        language: campaign.language
      },
      generatedAt,
      summary: {
        responseCount: responsesCount ?? 0,
        criticalItemsCount: criticalItems.length,
        sectionCount: sectionTable.length
      },
      sectionTable,
      criticalItems,
      recommendations: [
        criticalItems.length > 0 ? "Priorizar validacao humana imediata para itens criticos e secoes alto/critico." : "Manter monitoramento de rotina e validar tendencias antes de ampliar intervencoes.",
        "Revisar medidas operacionais diretamente nas secoes com maior media de risco.",
        "Usar o plano de acao como instrumento oficial de acompanhamento e auditoria."
      ],
      actionPlan: (actionPlans ?? []).map((item) => ({
        id: item.id,
        riskIdentified: item.risk_identified,
        sectionName: item.section_name,
        measure: item.measure,
        ownerName: item.owner_name,
        dueDate: item.due_date,
        status: item.status
      })),
      scale: riskClassificationScale.map((item) => ({ range: `${item.min.toFixed(1)}-${item.max.toFixed(1)}`, label: item.label }))
    }
  };
}

export async function createPendingGeneratedReportRecord(input: {
  campaignId: string | null;
  submissionId: string | null;
  reportType: ReportType;
  templateVersion: string;
  sourceAnalysisId: string | null;
  payloadJson: IndividualReportData | AnalyticalReportData;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("generated_reports")
    .insert({
      campaign_id: input.campaignId,
      submission_id: input.submissionId,
      report_type: input.reportType,
      template_version: input.templateVersion,
      source_analysis_id: input.sourceAnalysisId,
      payload_json: input.payloadJson,
      status: "pending",
      error_message: null,
      storage_path: null,
      generated_at: null,
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markGeneratedReportDone(reportId: string, storagePath: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("generated_reports")
    .update({
      status: "done" satisfies GeneratedReportStatus,
      error_message: null,
      storage_path: storagePath,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markGeneratedReportFailed(reportId: string, errorMessage: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("generated_reports")
    .update({
      status: "failed" satisfies GeneratedReportStatus,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getGeneratedReportById(reportId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("generated_reports").select("*").eq("id", reportId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLatestIndividualReportBySubmissionId(submissionId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("generated_reports")
    .select("id, status, error_message, requested_at, generated_at")
    .eq("submission_id", submissionId)
    .eq("report_type", "individual")
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPublicReceiptData(receiptCode: string): Promise<PublicReceiptData | null> {
  const supabase = createAdminSupabaseClient();
  const { data: submission, error } = await supabase
    .from("survey_submissions")
    .select("id, campaign_id, receipt_code, submitted_at, receipt_expires_at")
    .eq("receipt_code", receiptCode)
    .maybeSingle();

  if (error) throw error;
  if (!submission) return null;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name, questionnaire_id")
    .eq("id", submission.campaign_id)
    .maybeSingle();

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("name")
    .eq("id", campaign?.questionnaire_id)
    .maybeSingle();

  const report = await getLatestIndividualReportBySubmissionId(submission.id);

  return {
    receiptCode: submission.receipt_code,
    submittedAt: submission.submitted_at,
    receiptExpiresAt: submission.receipt_expires_at,
    campaignName: campaign?.name ?? "Campanha",
    questionnaireName: questionnaire?.name ?? "Questionario",
    reportStatus: report?.status ?? null
  };
}
