const { createClient } = require("@supabase/supabase-js");
const normalized = require("../supabase/seeds/nr1-questionnaire.json");
const { buildCampaignSyncPlan } = require("./lib/campaign-sync-plan");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const QUESTIONNAIRE_ID = normalized.questionnaire.id;
const CAMPAIGN_ID = "b1000000-0000-0000-0000-000000000001";
const LEGACY_QUESTIONNAIRE_ID = "a0000000-0000-0000-0000-000000000001";

const sections = normalized.sections.map((section) => ({
  id: section.id,
  order: section.order_index,
  name: section.name,
}));

const questions = normalized.sections.flatMap((section) =>
  section.questions.map((question) => ({
    id: question.id,
    section_id: section.id,
    prompt: question.prompt,
    answer_type: question.answer_type,
    scoring_direction: question.scoring_direction,
    weight: question.weight,
    is_required: question.is_required,
    is_active: question.is_active,
    order_index: question.order_index,
  }))
);

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingCampaigns, error: existingCampaignsError } = await supabase
    .from("campaigns")
    .select("id, name, status, questionnaire_id, sector, unit, start_date, end_date, language");
  if (existingCampaignsError) throw existingCampaignsError;

  const syncPlan = buildCampaignSyncPlan({
    questionnaireId: QUESTIONNAIRE_ID,
    existingCampaigns: existingCampaigns ?? [],
    defaultCampaign: {
      id: CAMPAIGN_ID,
      questionnaire_id: QUESTIONNAIRE_ID,
      name: "Diagnostico NR-1 - Setor de Costura",
      sector: "Producao",
      unit: "Costura",
      status: "active",
      start_date: "2026-04-01",
      end_date: "2026-12-31",
      language: "pt-BR",
    },
  });

  const { data: targetSections, error: targetSectionsError } = await supabase
    .from("questionnaire_sections")
    .select("id")
    .eq("questionnaire_id", QUESTIONNAIRE_ID);
  if (targetSectionsError) throw targetSectionsError;

  const targetSectionIds = (targetSections || []).map((item) => item.id);
  if (targetSectionIds.length > 0) {
    const { error } = await supabase
      .from("questionnaire_questions")
      .delete()
      .in("section_id", targetSectionIds);
    if (error) throw error;
  }

  const { data: legacySections, error: legacySectionsError } = await supabase
    .from("questionnaire_sections")
    .select("id")
    .eq("questionnaire_id", LEGACY_QUESTIONNAIRE_ID);
  if (legacySectionsError) throw legacySectionsError;

  const legacySectionIds = (legacySections || []).map((item) => item.id);
  if (legacySectionIds.length > 0) {
    const { error } = await supabase
      .from("questionnaire_questions")
      .delete()
      .in("section_id", legacySectionIds);
    if (error) throw error;
  }

  const { error: deleteTargetSectionsError } = await supabase
    .from("questionnaire_sections")
    .delete()
    .eq("questionnaire_id", QUESTIONNAIRE_ID);
  if (deleteTargetSectionsError) throw deleteTargetSectionsError;

  const { error: deleteLegacySectionsError } = await supabase
    .from("questionnaire_sections")
    .delete()
    .eq("questionnaire_id", LEGACY_QUESTIONNAIRE_ID);
  if (deleteLegacySectionsError) throw deleteLegacySectionsError;

  const { error: deleteTargetQuestionnaireError } = await supabase
    .from("questionnaires")
    .delete()
    .eq("id", QUESTIONNAIRE_ID);
  if (deleteTargetQuestionnaireError) throw deleteTargetQuestionnaireError;

  const { error: deleteLegacyQuestionnaireError } = await supabase
    .from("questionnaires")
    .delete()
    .eq("id", LEGACY_QUESTIONNAIRE_ID);
  if (deleteLegacyQuestionnaireError) throw deleteLegacyQuestionnaireError;

  const { error: insertQuestionnaireError } = await supabase
    .from("questionnaires")
    .insert({
      id: QUESTIONNAIRE_ID,
      name: normalized.questionnaire.name,
      version: normalized.questionnaire.version,
      status: "published",
      published_at: new Date().toISOString(),
    });
  if (insertQuestionnaireError) throw insertQuestionnaireError;

  const { error: insertSectionsError } = await supabase
    .from("questionnaire_sections")
    .insert(
      sections.map((section) => ({
        id: section.id,
        questionnaire_id: QUESTIONNAIRE_ID,
        name: section.name,
        order_index: section.order,
      }))
    );
  if (insertSectionsError) throw insertSectionsError;

  const { error: insertQuestionsError } = await supabase
    .from("questionnaire_questions")
    .insert(questions);
  if (insertQuestionsError) throw insertQuestionsError;

  if (syncPlan.shouldCreateDefaultCampaign) {
    const { error: insertCampaignError } = await supabase
      .from("campaigns")
      .insert(syncPlan.defaultCampaign);
    if (insertCampaignError) throw insertCampaignError;
  }

  const { count: questionCount, error: countError } = await supabase
    .from("questionnaire_questions")
    .select("*", { head: true, count: "exact" })
    .in(
      "section_id",
      sections.map((section) => section.id)
    );
  if (countError) throw countError;

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, status, questionnaire_id")
    .order("created_at", { ascending: false });
  if (campaignsError) throw campaignsError;

  console.log(
    JSON.stringify(
      {
        warnings: normalized.warnings,
        sections: sections.length,
        questions: questionCount,
        preservedCampaigns: syncPlan.campaignsToPreserve,
        campaigns,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
