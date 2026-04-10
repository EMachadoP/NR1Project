const fs = require("fs");
const path = require("path");

const normalized = require("../supabase/seeds/nr1-questionnaire.json");

const QUESTIONNAIRE_ID = normalized.questionnaire.id;
const CAMPAIGN_ID = "b1000000-0000-0000-0000-000000000001";
const LEGACY_QUESTIONNAIRE_ID = "a0000000-0000-0000-0000-000000000001";

const sql = (value) => `'${String(value).replace(/'/g, "''")}'`;

const sections = normalized.sections.map((section) => ({
  id: section.id,
  order: section.order_index,
  name: section.name,
  questions: section.questions,
}));

const questions = sections.flatMap((section) =>
  section.questions.map((question) => ({
    ...question,
    sectionId: section.id,
  }))
);

const lines = [];
lines.push("-- =====================================================");
lines.push("-- SEED DATA - QUESTIONARIO NR-1 SETOR DE COSTURA");
lines.push("-- =====================================================");
lines.push("-- Gerado automaticamente a partir de supabase/seeds/nr1-questionnaire.json");
if (normalized.warnings.length > 0) {
  lines.push("-- Avisos do importador:");
  for (const warning of normalized.warnings) {
    lines.push(`-- ${warning}`);
  }
}
lines.push("-- =====================================================");
lines.push("begin;");
lines.push("");
lines.push(
  `delete from public.questionnaire_questions where section_id in (select id from public.questionnaire_sections where questionnaire_id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)}));`
);
lines.push(
  `delete from public.questionnaire_sections where questionnaire_id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)});`
);
lines.push(
  `delete from public.questionnaires where id in (${sql(QUESTIONNAIRE_ID)}, ${sql(LEGACY_QUESTIONNAIRE_ID)});`
);
lines.push("");
lines.push(
  "insert into public.questionnaires (id, name, version, status, created_at, published_at)"
);
lines.push(
  `values (${sql(QUESTIONNAIRE_ID)}, ${sql(normalized.questionnaire.name)}, ${sql(normalized.questionnaire.version)}, 'published', timezone('utc', now()), timezone('utc', now()));`
);
lines.push("");
lines.push("insert into public.questionnaire_sections (id, questionnaire_id, name, order_index)");
lines.push("values");
lines.push(
  sections
    .map(
      (section) =>
        `  (${sql(section.id)}, ${sql(QUESTIONNAIRE_ID)}, ${sql(section.name)}, ${section.order})`
    )
    .join(",\n") + ";"
);
lines.push("");
lines.push(
  "insert into public.questionnaire_questions (id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index)"
);
lines.push("values");
lines.push(
  questions
    .map(
      (question) =>
        `  (${sql(question.id)}, ${sql(question.sectionId)}, ${sql(question.prompt)}, ${sql(question.answer_type)}, ${sql(question.scoring_direction)}, ${Number(question.weight).toFixed(1)}, ${question.is_required}, ${question.is_active}, ${question.order_index})`
    )
    .join(",\n") + ";"
);
lines.push("");
lines.push("select 'Questionarios' as tipo, count(*) as total from public.questionnaires");
lines.push("union all");
lines.push("select 'Secoes', count(*) from public.questionnaire_sections");
lines.push("union all");
lines.push("select 'Perguntas', count(*) from public.questionnaire_questions");
lines.push("union all");
lines.push("select 'Campanhas', count(*) from public.campaigns;");
lines.push("");
lines.push("commit;");
lines.push("");

const seedsDir = path.join(__dirname, "..", "supabase", "seeds");
const outputPath = path.join(seedsDir, "seed-initial.sql");
const tempOutputPath = path.join(seedsDir, "seed-initial.sql.tmp");

fs.mkdirSync(seedsDir, { recursive: true });
fs.writeFileSync(tempOutputPath, lines.join("\n"));
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}
fs.renameSync(tempOutputPath, outputPath);
console.log(`Generated seed with ${sections.length} sections and ${questions.length} questions.`);
