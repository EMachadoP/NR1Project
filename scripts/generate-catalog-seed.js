const fs = require('fs');
const path = require('path');

const catalog = require('../supabase/seeds/hazard-catalog.json');

const QUESTIONNAIRE_ID = 'a1000000-0000-0000-0000-000000000001';
const CAMPAIGN_ID = 'b1000000-0000-0000-0000-000000000001';
const LEGACY_QUESTIONNAIRE_ID = 'a0000000-0000-0000-0000-000000000001';

const sections = [
  { id: 'a1100000-0000-0000-0000-000000000001', key: 'organization', order: 0, name: 'Organizacao, Carga e Exigencias do Trabalho', codes: [1, 6, 7, 13, 14, 15, 27, 30, 31, 39, 40, 52, 66] },
  { id: 'a1100000-0000-0000-0000-000000000002', key: 'worklife', order: 1, name: 'Jornada, Ritmo e Conciliacao Trabalho-Vida', codes: [5, 9, 22, 23, 32, 35, 36, 48, 60, 65] },
  { id: 'a1100000-0000-0000-0000-000000000003', key: 'leadership', order: 2, name: 'Lideranca, Gestao, Justica e Clareza de Papeis', codes: [3, 8, 11, 16, 17, 18, 20, 42, 44, 54, 57, 59, 61, 63] },
  { id: 'a1100000-0000-0000-0000-000000000004', key: 'relationships', order: 3, name: 'Relacoes Interpessoais, Respeito e Apoio Social', codes: [2, 4, 10, 33, 43, 47, 49, 58, 62] },
  { id: 'a1100000-0000-0000-0000-000000000005', key: 'development', order: 4, name: 'Desenvolvimento, Reconhecimento e Seguranca de Carreira', codes: [21, 24, 26, 29, 45, 50, 56, 64, 68] },
  { id: 'a1100000-0000-0000-0000-000000000006', key: 'conditions', order: 5, name: 'Condicoes e Contexto Material de Trabalho', codes: [19, 34, 37, 38] },
  { id: 'a1100000-0000-0000-0000-000000000007', key: 'wellbeing', order: 6, name: 'Saude Mental, Bem-Estar e Engajamento', codes: [12, 25, 28, 41, 46, 51, 53, 55, 67] }
];

const sectionByCode = new Map();
for (const section of sections) {
  for (const code of section.codes) sectionByCode.set(code, section);
}

const normalize = (value) => String(value || '').replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
const sql = (value) => `'${String(value).replace(/'/g, "''")}'`;

const questions = catalog.map((row) => {
  const section = sectionByCode.get(row.code);
  if (!section) throw new Error(`Missing section mapping for code ${row.code}`);
  return {
    id: `c1000000-0000-0000-0000-${String(row.code).padStart(12, '0')}`,
    sectionId: section.id,
    orderIndex: section.codes.indexOf(row.code),
    prompt: normalize(row.hazard),
    answerType: 'likert_1_5',
    scoringDirection: 'negative',
    weight: Number(row.severity_score || 1),
    isRequired: true,
    isActive: true,
    hazardCode: row.code,
    sourceReference: normalize(row.source),
    severityScore: Number(row.severity_score || 1),
    severityLabel: normalize(row.severity_label),
    circumstancesText: normalize(row.sources),
    outcomesText: normalize(row.outcomes),
    recommendedActionsText: normalize(row.severity_description),
    monitoringGuidanceText: normalize(row.actions)
  };
});

const lines = [];
lines.push('-- =====================================================');
lines.push('-- SEED DATA - CATALOGO TECNICO NR-1 / COPSOQ-II');
lines.push('-- =====================================================');
lines.push('-- Gerado automaticamente a partir de supabase/seeds/hazard-catalog.json');
lines.push('-- =====================================================');
lines.push('begin;');
lines.push('');
lines.push(`delete from public.campaigns where questionnaire_id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)});`);
lines.push(`delete from public.questionnaire_questions where section_id in (select id from public.questionnaire_sections where questionnaire_id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)}));`);
lines.push(`delete from public.questionnaire_sections where questionnaire_id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)});`);
lines.push(`delete from public.questionnaires where id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)});`);
lines.push('');
lines.push('insert into public.questionnaires (id, name, version, status, created_at, published_at)');
lines.push(`values (${sql(QUESTIONNAIRE_ID)}, ${sql('Catalogo Tecnico de Perigos Psicossociais NR-1')}, ${sql('v2.0.0')}, 'published', timezone('utc', now()), timezone('utc', now()));`);
lines.push('');
lines.push('insert into public.questionnaire_sections (id, questionnaire_id, name, order_index)');
lines.push('values');
lines.push(sections.map((section) => `  (${sql(section.id)}, ${sql(QUESTIONNAIRE_ID)}, ${sql(section.name)}, ${section.order})`).join(',\n') + ';');
lines.push('');
lines.push('insert into public.questionnaire_questions (id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index, hazard_code, source_reference, severity_score, severity_label, circumstances_text, outcomes_text, recommended_actions_text, monitoring_guidance_text)');
lines.push('values');
lines.push(questions.map((question) => `  (${sql(question.id)}, ${sql(question.sectionId)}, ${sql(question.prompt)}, ${sql(question.answerType)}, ${sql(question.scoringDirection)}, ${question.weight.toFixed(1)}, ${question.isRequired}, ${question.isActive}, ${question.orderIndex}, ${question.hazardCode}, ${sql(question.sourceReference)}, ${question.severityScore}, ${sql(question.severityLabel)}, ${sql(question.circumstancesText)}, ${sql(question.outcomesText)}, ${sql(question.recommendedActionsText)}, ${sql(question.monitoringGuidanceText)})`).join(',\n') + ';');
lines.push('');
lines.push('insert into public.campaigns (id, questionnaire_id, name, sector, unit, status, start_date, end_date, language, created_at)');
lines.push(`values (${sql(CAMPAIGN_ID)}, ${sql(QUESTIONNAIRE_ID)}, ${sql('Diagnostico Psicossocial NR-1 - Catalogo Base')}, ${sql('Escopo Geral')}, ${sql('Organizacao')}, 'active', '2026-04-01', '2026-12-31', 'pt-BR', timezone('utc', now()));`);
lines.push('');
lines.push("select 'Questionarios' as tipo, count(*) as total from public.questionnaires");
lines.push('union all');
lines.push("select 'Secoes', count(*) from public.questionnaire_sections");
lines.push('union all');
lines.push("select 'Perguntas', count(*) from public.questionnaire_questions");
lines.push('union all');
lines.push("select 'Campanhas', count(*) from public.campaigns;");
lines.push('');
lines.push('commit;');
lines.push('');

fs.mkdirSync(path.join(__dirname, '..', 'supabase', 'seeds'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seeds', 'seed-initial.sql'), lines.join('\n'));
console.log(`Generated seed with ${sections.length} sections and ${questions.length} questions.`);
