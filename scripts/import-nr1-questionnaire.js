const path = require("path");
const editorialData = require("../supabase/seeds/nr1-questionnaire-editorial.json");
const {
  buildNormalizedQuestionnaire,
  parseWorkbookSections,
  writeNormalizedQuestionnaire,
} = require("./lib/nr1-questionnaire-parser");

const workbookPath = path.resolve("supabase/seeds/source/nr1-questionario.xlsx");
const outputPath = path.resolve("supabase/seeds/nr1-questionnaire.json");

const parsedWorkbook = parseWorkbookSections(workbookPath);
const normalizedQuestionnaire = buildNormalizedQuestionnaire(
  parsedWorkbook,
  editorialData
);

writeNormalizedQuestionnaire(outputPath, normalizedQuestionnaire);

const questionCount = normalizedQuestionnaire.sections.reduce(
  (total, section) => total + section.questions.length,
  0
);

console.log(
  `Generated ${normalizedQuestionnaire.sections.length} sections and ${questionCount} questions.`
);
