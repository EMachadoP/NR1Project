const path = require("path");
const xlsx = require("xlsx");

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWorkbookSections(workbookPath) {
  const absolutePath = path.resolve(workbookPath);
  const workbook = xlsx.readFile(absolutePath);
  const sheet = workbook.Sheets["Questionário"] ?? workbook.Sheets["Questionario"];

  if (!sheet) {
    throw new Error("Workbook is missing the Questionario sheet.");
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  const sections = [];
  let currentSection = null;
  let scaleLabels = [];

  for (const row of rows) {
    const itemNumber = normalizeText(row[0]);
    const promptOrSection = normalizeText(row[1]);

    if (!promptOrSection) {
      continue;
    }

    const looksLikeSection =
      itemNumber === "" &&
      promptOrSection === promptOrSection.toUpperCase();

    if (looksLikeSection) {
      currentSection = {
        name: promptOrSection,
        questions: [],
      };
      sections.push(currentSection);

      if (scaleLabels.length === 0) {
        scaleLabels = row
          .slice(2, 7)
          .map((value) => normalizeText(value))
          .filter(Boolean);
      }

      continue;
    }

    if (/^\d+$/.test(itemNumber) && currentSection) {
      currentSection.questions.push({
        prompt: promptOrSection,
      });
    }
  }

  return {
    scaleLabels,
    sections,
  };
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildQuestion(sectionSlug, prompt, orderIndex) {
  return {
    id: `${sectionSlug}-q${String(orderIndex + 1).padStart(2, "0")}`,
    prompt,
    answer_type: "likert_1_5",
    scoring_direction: "negative",
    weight: 1,
    is_required: true,
    is_active: true,
    order_index: orderIndex,
  };
}

function buildNormalizedQuestionnaire(workbookData, editorialData) {
  if (!editorialData?.questionnaire) {
    throw new Error("Editorial data must include questionnaire metadata.");
  }

  const sections = [];
  const warnings = [];

  for (const workbookSection of workbookData.sections) {
    const sectionSlug = slugify(workbookSection.name);
    sections.push({
      id: `nr1-${sectionSlug}`,
      name: workbookSection.name,
      order_index: sections.length,
      source: "workbook",
      questions: workbookSection.questions.map((question, questionIndex) =>
        buildQuestion(`nr1-${sectionSlug}`, question.prompt, questionIndex)
      ),
    });
  }

  for (const editorialSection of editorialData.sections ?? []) {
    const normalizedName = normalizeText(editorialSection.name);
    const alreadyExists = sections.some(
      (section) => normalizeText(section.name) === normalizedName
    );

    if (alreadyExists) {
      continue;
    }

    const sectionSlug = slugify(editorialSection.name);
    sections.push({
      id: `nr1-${sectionSlug}`,
      name: editorialSection.name,
      order_index: sections.length,
      source: "editorial",
      questions: (editorialSection.questions ?? []).map((question, questionIndex) =>
        buildQuestion(`nr1-${sectionSlug}`, normalizeText(question.prompt), questionIndex)
      ),
    });
  }

  const expectedSectionCount = Number(editorialData.expectedSectionCount ?? 12);
  if (workbookData.sections.length !== expectedSectionCount) {
    warnings.push(
      `divergencia detectada: a aba Questionario possui ${workbookData.sections.length} secoes visiveis, mas a estrutura alvo exige ${expectedSectionCount}.`
    );
  }

  return {
    questionnaire: {
      id: editorialData.questionnaire.id ?? "a1000000-0000-0000-0000-000000000001",
      name: editorialData.questionnaire.name,
      version: editorialData.questionnaire.version,
      status: "published",
    },
    scaleLabels: workbookData.scaleLabels,
    warnings,
    sections,
  };
}

function writeNormalizedQuestionnaire(outputPath, questionnaire) {
  const fs = require("fs");
  fs.writeFileSync(outputPath, JSON.stringify(questionnaire, null, 2) + "\n");
}

module.exports = {
  buildNormalizedQuestionnaire,
  normalizeText,
  parseWorkbookSections,
  writeNormalizedQuestionnaire,
};
