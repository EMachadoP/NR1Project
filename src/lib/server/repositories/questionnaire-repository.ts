import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export type QuestionInput = {
  prompt: string;
  answer_type: string;
  scoring_direction: "positive" | "negative" | null;
  weight: number;
  is_required: boolean;
};

export type SectionInput = {
  name: string;
  questions: QuestionInput[];
};

export async function listQuestionnaires(status?: string) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("questionnaires")
    .select("id, name, version, status, created_at, published_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status as "draft" | "published" | "archived");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getQuestionnaireWithSections(id: string) {
  const supabase = createAdminSupabaseClient();

  const { data: questionnaire, error } = await supabase
    .from("questionnaires")
    .select("id, name, version, status, created_at, published_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!questionnaire) return null;

  const { data: sections, error: sectionsError } = await supabase
    .from("questionnaire_sections")
    .select("id, name, order_index")
    .eq("questionnaire_id", id)
    .order("order_index", { ascending: true });

  if (sectionsError) throw sectionsError;

  const sectionIds = (sections ?? []).map((s) => s.id);

  const { data: questions, error: questionsError } = await supabase
    .from("questionnaire_questions")
    .select("id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index")
    .in("section_id", sectionIds.length > 0 ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index", { ascending: true });

  if (questionsError) throw questionsError;

  return {
    ...questionnaire,
    sections: (sections ?? []).map((section) => ({
      ...section,
      questions: (questions ?? []).filter((q) => q.section_id === section.id)
    }))
  };
}

export async function createQuestionnaireDraft(name: string, version: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("questionnaires")
    .insert({ name, version, status: "draft" })
    .select("id, name, version, status")
    .single();

  if (error) throw error;
  return data;
}

export async function saveQuestionnaire(
  id: string,
  payload: { name: string; version: string; sections: SectionInput[] }
) {
  const supabase = createAdminSupabaseClient();

  const { error: updateError } = await supabase
    .from("questionnaires")
    .update({ name: payload.name, version: payload.version })
    .eq("id", id);

  if (updateError) throw updateError;

  // Full replace: delete existing sections (cascades to questions)
  const { error: deleteError } = await supabase
    .from("questionnaire_sections")
    .delete()
    .eq("questionnaire_id", id);

  if (deleteError) throw deleteError;

  for (let sIdx = 0; sIdx < payload.sections.length; sIdx++) {
    const section = payload.sections[sIdx];

    const { data: newSection, error: sectionError } = await supabase
      .from("questionnaire_sections")
      .insert({ questionnaire_id: id, name: section.name, order_index: sIdx })
      .select("id")
      .single();

    if (sectionError) throw sectionError;

    if (section.questions.length > 0) {
      const { error: questionsError } = await supabase
        .from("questionnaire_questions")
        .insert(
          section.questions.map((q, qIdx) => ({
            section_id: newSection.id,
            prompt: q.prompt,
            answer_type: q.answer_type,
            scoring_direction: q.scoring_direction ?? null,
            weight: q.weight,
            is_required: q.is_required,
            is_active: true,
            order_index: qIdx
          }))
        );

      if (questionsError) throw questionsError;
    }
  }
}

export async function publishQuestionnaire(id: string) {
  const supabase = createAdminSupabaseClient();

  // Check that the questionnaire has at least one section with one question
  const questionnaire = await getQuestionnaireWithSections(id);
  if (!questionnaire) throw new Error("NOT_FOUND");
  if (questionnaire.sections.length === 0) throw new Error("QUESTIONNAIRE_EMPTY");
  if (questionnaire.sections.some((s) => s.questions.length === 0)) throw new Error("SECTION_EMPTY");

  // Archive currently published questionnaires
  await supabase
    .from("questionnaires")
    .update({ status: "archived" })
    .eq("status", "published")
    .neq("id", id);

  const { data, error } = await supabase
    .from("questionnaires")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, version, status, published_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuestionnaire(id: string) {
  const supabase = createAdminSupabaseClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("questionnaire_id", id)
    .limit(1);

  if (campaigns && campaigns.length > 0) throw new Error("QUESTIONNAIRE_IN_USE");

  const { error } = await supabase.from("questionnaires").delete().eq("id", id);
  if (error) throw error;
}
