const { createClient } = require('@supabase/supabase-js');
const catalog = require('../supabase/seeds/hazard-catalog.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const QUESTIONNAIRE_ID = 'a1000000-0000-0000-0000-000000000001';
const CAMPAIGN_ID = 'b1000000-0000-0000-0000-000000000001';
const LEGACY_QUESTIONNAIRE_ID = 'a0000000-0000-0000-0000-000000000001';

const sections = [
  { id: 'a1100000-0000-0000-0000-000000000001', order: 0, name: 'Organizacao, Carga e Exigencias do Trabalho', codes: [1, 6, 7, 13, 14, 15, 27, 30, 31, 39, 40, 52, 66] },
  { id: 'a1100000-0000-0000-0000-000000000002', order: 1, name: 'Jornada, Ritmo e Conciliacao Trabalho-Vida', codes: [5, 9, 22, 23, 32, 35, 36, 48, 60, 65] },
  { id: 'a1100000-0000-0000-0000-000000000003', order: 2, name: 'Lideranca, Gestao, Justica e Clareza de Papeis', codes: [3, 8, 11, 16, 17, 18, 20, 42, 44, 54, 57, 59, 61, 63] },
  { id: 'a1100000-0000-0000-0000-000000000004', order: 3, name: 'Relacoes Interpessoais, Respeito e Apoio Social', codes: [2, 4, 10, 33, 43, 47, 49, 58, 62] },
  { id: 'a1100000-0000-0000-0000-000000000005', order: 4, name: 'Desenvolvimento, Reconhecimento e Seguranca de Carreira', codes: [21, 24, 26, 29, 45, 50, 56, 64, 68] },
  { id: 'a1100000-0000-0000-0000-000000000006', order: 5, name: 'Condicoes e Contexto Material de Trabalho', codes: [19, 34, 37, 38] },
  { id: 'a1100000-0000-0000-0000-000000000007', order: 6, name: 'Saude Mental, Bem-Estar e Engajamento', codes: [12, 25, 28, 41, 46, 51, 53, 55, 67] }
];

const sectionByCode = new Map();
for (const section of sections) {
  for (const code of section.codes) sectionByCode.set(code, section);
}

const normalize = (value) => String(value || '').replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

const questions = catalog.map((row) => {
  const section = sectionByCode.get(row.code);
  if (!section) throw new Error(`Missing section mapping for code ${row.code}`);
  return {
    id: `c1000000-0000-0000-0000-${String(row.code).padStart(12, '0')}`,
    section_id: section.id,
    prompt: normalize(row.hazard),
    answer_type: 'likert_1_5',
    scoring_direction: 'negative',
    weight: Number(row.severity_score || 1),
    is_required: true,
    is_active: true,
    order_index: section.codes.indexOf(row.code),
    hazard_code: row.code,
    source_reference: normalize(row.source),
    severity_score: Number(row.severity_score || 1),
    severity_label: normalize(row.severity_label),
    circumstances_text: normalize(row.sources),
    outcomes_text: normalize(row.outcomes),
    recommended_actions_text: normalize(row.severity_description),
    monitoring_guidance_text: normalize(row.actions)
  };
});

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { error: deleteNewCampaignsError } = await supabase.from('campaigns').delete().eq('questionnaire_id', QUESTIONNAIRE_ID);
  if (deleteNewCampaignsError) throw deleteNewCampaignsError;
  const { error: deleteLegacyCampaignsError } = await supabase.from('campaigns').delete().eq('questionnaire_id', LEGACY_QUESTIONNAIRE_ID);
  if (deleteLegacyCampaignsError) throw deleteLegacyCampaignsError;

  const { data: targetSections, error: targetSectionsError } = await supabase.from('questionnaire_sections').select('id').eq('questionnaire_id', QUESTIONNAIRE_ID);
  if (targetSectionsError) throw targetSectionsError;
  const targetSectionIds = (targetSections || []).map((item) => item.id);
  if (targetSectionIds.length > 0) {
    const { error } = await supabase.from('questionnaire_questions').delete().in('section_id', targetSectionIds);
    if (error) throw error;
  }

  const { data: legacySections, error: legacySectionsError } = await supabase.from('questionnaire_sections').select('id').eq('questionnaire_id', LEGACY_QUESTIONNAIRE_ID);
  if (legacySectionsError) throw legacySectionsError;
  const legacySectionIds = (legacySections || []).map((item) => item.id);
  if (legacySectionIds.length > 0) {
    const { error } = await supabase.from('questionnaire_questions').delete().in('section_id', legacySectionIds);
    if (error) throw error;
  }

  const { error: deleteTargetSectionsError } = await supabase.from('questionnaire_sections').delete().eq('questionnaire_id', QUESTIONNAIRE_ID);
  if (deleteTargetSectionsError) throw deleteTargetSectionsError;
  const { error: deleteLegacySectionsError } = await supabase.from('questionnaire_sections').delete().eq('questionnaire_id', LEGACY_QUESTIONNAIRE_ID);
  if (deleteLegacySectionsError) throw deleteLegacySectionsError;

  const { error: deleteTargetQuestionnaireError } = await supabase.from('questionnaires').delete().eq('id', QUESTIONNAIRE_ID);
  if (deleteTargetQuestionnaireError) throw deleteTargetQuestionnaireError;
  const { error: deleteLegacyQuestionnaireError } = await supabase.from('questionnaires').delete().eq('id', LEGACY_QUESTIONNAIRE_ID);
  if (deleteLegacyQuestionnaireError) throw deleteLegacyQuestionnaireError;

  const { error: insertQuestionnaireError } = await supabase.from('questionnaires').insert({
    id: QUESTIONNAIRE_ID,
    name: 'Catalogo Tecnico de Perigos Psicossociais NR-1',
    version: 'v2.0.0',
    status: 'published',
    published_at: new Date().toISOString()
  });
  if (insertQuestionnaireError) throw insertQuestionnaireError;

  const { error: insertSectionsError } = await supabase.from('questionnaire_sections').insert(
    sections.map((section) => ({
      id: section.id,
      questionnaire_id: QUESTIONNAIRE_ID,
      name: section.name,
      order_index: section.order
    }))
  );
  if (insertSectionsError) throw insertSectionsError;

  const { error: insertQuestionsError } = await supabase.from('questionnaire_questions').insert(questions);
  if (insertQuestionsError) throw insertQuestionsError;

  const { error: insertCampaignError } = await supabase.from('campaigns').insert({
    id: CAMPAIGN_ID,
    questionnaire_id: QUESTIONNAIRE_ID,
    name: 'Diagnostico Psicossocial NR-1 - Catalogo Base',
    sector: 'Escopo Geral',
    unit: 'Organizacao',
    status: 'active',
    start_date: '2026-04-01',
    end_date: '2026-12-31',
    language: 'pt-BR'
  });
  if (insertCampaignError) throw insertCampaignError;

  const { count: questionCount, error: countError } = await supabase.from('questionnaire_questions').select('*', { head: true, count: 'exact' }).in('section_id', sections.map((section) => section.id));
  if (countError) throw countError;

  const { data: campaigns, error: campaignsError } = await supabase.from('campaigns').select('id, name, status, questionnaire_id').order('created_at', { ascending: false });
  if (campaignsError) throw campaignsError;

  console.log(JSON.stringify({ sections: sections.length, questions: questionCount, campaigns }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
