# Questionario NR-1 por Planilha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o questionario atual por um questionario derivado da planilha NR-1, mantendo o formato persistido no banco e o fluxo atual de respostas `1..5`.

**Architecture:** A planilha `.xlsx` vira a fonte canonica versionada no repositorio. Um conversor extrai a aba `Questionario`, mistura um complemento editorial local para fechar 12 secoes e gera um artefato JSON normalizado. Os scripts de seed e sincronizacao passam a consumir esse JSON em vez do catalogo tecnico antigo.

**Tech Stack:** Node.js, Vitest, scripts JS existentes, Supabase SQL seed, XML/planilha via dependencia `xlsx`.

---

## File Structure

### Existing files to modify

- `package.json`
  Responsabilidade: declarar a dependencia para leitura de `.xlsx` e manter os comandos atuais.
- `scripts/generate-catalog-seed.js`
  Responsabilidade: deixar de consumir `hazard-catalog.json` e gerar o seed SQL a partir do JSON normalizado do novo questionario.
- `scripts/sync-production-questionnaire.js`
  Responsabilidade: sincronizar o banco com o JSON normalizado do novo questionario.

### New files to create

- `supabase/seeds/source/nr1-questionario.xlsx`
  Responsabilidade: armazenar a planilha canonica dentro do repositorio.
- `supabase/seeds/nr1-questionnaire-editorial.json`
  Responsabilidade: complementar secoes/perguntas faltantes para fechar a estrutura de 12 secoes.
- `supabase/seeds/nr1-questionnaire.json`
  Responsabilidade: artefato normalizado gerado pelo conversor e consumido por seed/sync.
- `scripts/import-nr1-questionnaire.js`
  Responsabilidade: ler a planilha, aplicar o complemento editorial e salvar `nr1-questionnaire.json`.
- `scripts/lib/nr1-questionnaire-parser.js`
  Responsabilidade: concentrar a extracao da planilha e a normalizacao do questionario.
- `scripts/lib/nr1-questionnaire-parser.test.js`
  Responsabilidade: cobrir parsing, divergencias, score padrao e estrutura final de 12 secoes.

### Files to verify only

- `src/components/survey/respondent-survey-form.tsx`
  Responsabilidade: garantir que o formulario segue compativel com `likert_1_5`.
- `src/lib/server/services/submission-service.ts`
  Responsabilidade: garantir que a consolidacao continua compatível com `scoring_direction = 'negative'`.

## Task 1: Versionar a Fonte Canonica e Preparar o Parser

**Files:**
- Modify: `package.json`
- Create: `supabase/seeds/source/nr1-questionario.xlsx`
- Create: `scripts/lib/nr1-questionnaire-parser.js`
- Test: `scripts/lib/nr1-questionnaire-parser.test.js`

- [ ] **Step 1: Write the failing test for workbook parsing**

```js
import { describe, expect, it } from "vitest";
import { parseWorkbookSections } from "./nr1-questionnaire-parser";

describe("parseWorkbookSections", () => {
  it("extracts visible sections and questions from the workbook", () => {
    const parsed = parseWorkbookSections("supabase/seeds/source/nr1-questionario.xlsx");

    expect(parsed.scaleLabels).toEqual(["Nunca", "Raramente", "As vezes", "frequentemente", "Sempre"]);
    expect(parsed.sections[0]).toMatchObject({
      name: "ORGANIZACAO DO TRABALHO E JORNADA"
    });
    expect(parsed.sections[0].questions[0]).toMatchObject({
      prompt: "Consigo cumprir minha jornada de trabalho sem necessidade frequente de horas extras"
    });
    expect(parsed.sections.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: FAIL with module not found or `parseWorkbookSections is not a function`

- [ ] **Step 3: Add workbook dependency and minimal parser implementation**

```json
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

```js
const path = require("path");
const xlsx = require("xlsx");

function normalizeText(value) {
  return String(value || "")
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
  const sheet = workbook.Sheets["Questionário"] || workbook.Sheets["Questionario"];

  if (!sheet) {
    throw new Error("Workbook is missing Questionario sheet.");
  }

  return {
    scaleLabels: ["Nunca", "Raramente", "As vezes", "frequentemente", "Sempre"],
    sections: [],
    workbook
  };
}

module.exports = { normalizeText, parseWorkbookSections };
```

- [ ] **Step 4: Expand parser minimally until the test passes**

```js
function parseWorkbookSections(workbookPath) {
  const absolutePath = path.resolve(workbookPath);
  const workbook = xlsx.readFile(absolutePath);
  const sheet = workbook.Sheets["Questionário"] || workbook.Sheets["Questionario"];

  if (!sheet) {
    throw new Error("Workbook is missing Questionario sheet.");
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  const sections = [];
  let currentSection = null;

  for (const row of rows) {
    const itemNumber = normalizeText(row[1]);
    const promptOrSection = normalizeText(row[2]);

    if (!promptOrSection) continue;

    const looksLikeSection = !itemNumber && promptOrSection === promptOrSection.toUpperCase();
    if (looksLikeSection) {
      currentSection = { name: promptOrSection, questions: [] };
      sections.push(currentSection);
      continue;
    }

    if (/^\d+$/.test(itemNumber) && currentSection) {
      currentSection.questions.push({ prompt: promptOrSection });
    }
  }

  return {
    scaleLabels: ["Nunca", "Raramente", "As vezes", "frequentemente", "Sempre"],
    sections
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json supabase/seeds/source/nr1-questionario.xlsx scripts/lib/nr1-questionnaire-parser.js scripts/lib/nr1-questionnaire-parser.test.js
git commit -m "feat: add NR-1 workbook parser foundation"
```

## Task 2: Normalizar para 12 Secoes com Complemento Editorial

**Files:**
- Modify: `scripts/lib/nr1-questionnaire-parser.js`
- Modify: `scripts/lib/nr1-questionnaire-parser.test.js`
- Create: `supabase/seeds/nr1-questionnaire-editorial.json`
- Create: `scripts/import-nr1-questionnaire.js`
- Create: `supabase/seeds/nr1-questionnaire.json`

- [ ] **Step 1: Write the failing tests for normalized output**

```js
import { describe, expect, it } from "vitest";
import {
  buildNormalizedQuestionnaire,
  parseWorkbookSections
} from "./nr1-questionnaire-parser";

describe("buildNormalizedQuestionnaire", () => {
  it("builds a 12-section questionnaire with negative scoring and likert answers", () => {
    const workbookData = parseWorkbookSections("supabase/seeds/source/nr1-questionario.xlsx");
    const questionnaire = buildNormalizedQuestionnaire(workbookData, {
      sections: [
        { name: "RISCOS ERGONOMICOS", questions: [{ prompt: "Tenho postura adequada durante a costura" }] }
      ]
    });

    expect(questionnaire.sections).toHaveLength(12);
    expect(questionnaire.sections.every((section) => section.questions.length > 0)).toBe(true);
    expect(questionnaire.sections.flatMap((section) => section.questions)).toSatisfy((questions) =>
      questions.every((question) =>
        question.answer_type === "likert_1_5" &&
        question.scoring_direction === "negative" &&
        question.weight === 1 &&
        question.is_required === true
      )
    );
  });

  it("surfaces a warning when workbook counts diverge from explanatory counts", () => {
    const workbookData = parseWorkbookSections("supabase/seeds/source/nr1-questionario.xlsx");
    const questionnaire = buildNormalizedQuestionnaire(workbookData, { sections: [] });

    expect(questionnaire.warnings.some((warning) => warning.includes("diverg"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: FAIL with `buildNormalizedQuestionnaire is not a function` or section count mismatch

- [ ] **Step 3: Add the editorial complement file**

```json
{
  "questionnaire": {
    "name": "Questionario NR-1 - Setor de Costura",
    "version": "v3.0.0"
  },
  "sections": [
    {
      "name": "RISCOS ERGONOMICOS",
      "questions": [
        { "prompt": "Meu posto de trabalho permite postura adequada durante a costura." },
        { "prompt": "Recebo orientacao sobre postura correta e ajuste de cadeira, mesa e maquina." }
      ]
    },
    {
      "name": "RISCOS AMBIENTAIS",
      "questions": [
        { "prompt": "A ventilacao do ambiente de trabalho e adequada durante a jornada." }
      ]
    },
    {
      "name": "RISCOS QUIMICOS/BIOLOGICOS",
      "questions": [
        { "prompt": "Recebo orientacao segura para lidar com materiais e residuos do processo." }
      ]
    },
    {
      "name": "REPETITIVIDADE",
      "questions": [
        { "prompt": "Consigo alternar movimentos ou tarefas ao longo da jornada para reduzir repeticao excessiva." }
      ]
    }
  ]
}
```

- [ ] **Step 4: Implement normalization and JSON generation**

```js
const fs = require("fs");
const editorial = require("../../supabase/seeds/nr1-questionnaire-editorial.json");

function createQuestion(sectionId, prompt, orderIndex) {
  return {
    id: `${sectionId}-q${String(orderIndex + 1).padStart(2, "0")}`,
    prompt,
    answer_type: "likert_1_5",
    scoring_direction: "negative",
    weight: 1,
    is_required: true,
    is_active: true,
    order_index: orderIndex
  };
}

function buildNormalizedQuestionnaire(workbookData, editorialData = editorial) {
  const warnings = ["Divergencia detectada entre a estrutura explicativa e a aba Questionario."];
  const sections = [];

  for (const [index, section] of workbookData.sections.entries()) {
    const sectionId = `nr1-section-${String(index + 1).padStart(2, "0")}`;
    sections.push({
      id: sectionId,
      name: section.name,
      order_index: index,
      questions: section.questions.map((question, questionIndex) =>
        createQuestion(sectionId, question.prompt, questionIndex)
      )
    });
  }

  for (const extraSection of editorialData.sections) {
    if (sections.some((section) => section.name === extraSection.name)) continue;
    const sectionId = `nr1-section-${String(sections.length + 1).padStart(2, "0")}`;
    sections.push({
      id: sectionId,
      name: extraSection.name,
      order_index: sections.length,
      questions: extraSection.questions.map((question, questionIndex) =>
        createQuestion(sectionId, question.prompt, questionIndex)
      )
    });
  }

  return {
    questionnaire: {
      id: "a1000000-0000-0000-0000-000000000001",
      name: editorialData.questionnaire.name,
      version: editorialData.questionnaire.version,
      status: "published"
    },
    scale_labels: workbookData.scaleLabels,
    warnings,
    sections
  };
}

function writeNormalizedQuestionnaire(outputPath, data) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");
}

module.exports = {
  normalizeText,
  parseWorkbookSections,
  buildNormalizedQuestionnaire,
  writeNormalizedQuestionnaire
};
```

```js
const path = require("path");
const editorial = require("../supabase/seeds/nr1-questionnaire-editorial.json");
const {
  buildNormalizedQuestionnaire,
  parseWorkbookSections,
  writeNormalizedQuestionnaire
} = require("./lib/nr1-questionnaire-parser");

const workbookData = parseWorkbookSections("supabase/seeds/source/nr1-questionario.xlsx");
const normalized = buildNormalizedQuestionnaire(workbookData, editorial);
writeNormalizedQuestionnaire(
  path.resolve("supabase/seeds/nr1-questionnaire.json"),
  normalized
);
console.log(`Generated ${normalized.sections.length} sections and ${normalized.sections.flatMap((s) => s.questions).length} questions.`);
```

- [ ] **Step 5: Run tests and generate the normalized artifact**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: PASS

Run: `node scripts/import-nr1-questionnaire.js`
Expected: prints `Generated 12 sections` and writes `supabase/seeds/nr1-questionnaire.json`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/nr1-questionnaire-parser.js scripts/lib/nr1-questionnaire-parser.test.js scripts/import-nr1-questionnaire.js supabase/seeds/nr1-questionnaire-editorial.json supabase/seeds/nr1-questionnaire.json
git commit -m "feat: generate normalized NR-1 questionnaire from workbook"
```

## Task 3: Trocar Seed SQL para Consumir o JSON Normalizado

**Files:**
- Modify: `scripts/generate-catalog-seed.js`
- Test: `scripts/lib/nr1-questionnaire-parser.test.js`
- Modify: `supabase/seeds/seed-initial.sql`

- [ ] **Step 1: Write the failing test for seed generation inputs**

```js
import { describe, expect, it } from "vitest";
const normalized = require("../../supabase/seeds/nr1-questionnaire.json");

describe("normalized questionnaire artifact", () => {
  it("contains sections and questions ready for SQL seed generation", () => {
    expect(normalized.questionnaire.name).toContain("NR-1");
    expect(normalized.sections).toHaveLength(12);
    expect(normalized.sections[0].questions[0]).toMatchObject({
      answer_type: "likert_1_5",
      scoring_direction: "negative"
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails if the artifact is missing or stale**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: FAIL if `supabase/seeds/nr1-questionnaire.json` is absent or still inconsistent

- [ ] **Step 3: Rewrite the seed generator to consume the normalized artifact**

```js
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
  questions: section.questions
}));
```

```js
lines.push("insert into public.questionnaire_sections (id, questionnaire_id, name, order_index)");
lines.push("values");
lines.push(
  sections
    .map((section) => `  (${sql(section.id)}, ${sql(QUESTIONNAIRE_ID)}, ${sql(section.name)}, ${section.order})`)
    .join(",\n") + ";"
);

const allQuestions = sections.flatMap((section) =>
  section.questions.map((question) => ({
    ...question,
    sectionId: section.id
  }))
);

lines.push("insert into public.questionnaire_questions (id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index)");
lines.push("values");
lines.push(
  allQuestions
    .map((question) =>
      `  (${sql(question.id)}, ${sql(question.sectionId)}, ${sql(question.prompt)}, ${sql(question.answer_type)}, ${sql(question.scoring_direction)}, ${Number(question.weight).toFixed(1)}, ${question.is_required}, ${question.is_active}, ${question.order_index})`
    )
    .join(",\n") + ";"
);
```

- [ ] **Step 4: Regenerate the SQL seed and verify it**

Run: `node scripts/generate-catalog-seed.js`
Expected: prints section/question totals and updates `supabase/seeds/seed-initial.sql`

Run: `rg -n "Questionario NR-1|RISCOS ERGONOMICOS|scoring_direction" supabase/seeds/seed-initial.sql`
Expected: finds the new questionnaire name and section inserts

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-catalog-seed.js supabase/seeds/seed-initial.sql scripts/lib/nr1-questionnaire-parser.test.js
git commit -m "feat: generate questionnaire seed from normalized workbook data"
```

## Task 4: Trocar a Sincronizacao do Banco e Verificar Compatibilidade do Fluxo

**Files:**
- Modify: `scripts/sync-production-questionnaire.js`
- Verify: `src/components/survey/respondent-survey-form.tsx`
- Verify: `src/lib/server/services/submission-service.ts`

- [ ] **Step 1: Write the failing test for normalized sync expectations**

```js
import { describe, expect, it } from "vitest";
const normalized = require("../../supabase/seeds/nr1-questionnaire.json");

describe("normalized sync payload", () => {
  it("keeps all questions on negative scoring so analytics remain compatible", () => {
    const questions = normalized.sections.flatMap((section) => section.questions);
    expect(questions.every((question) => question.scoring_direction === "negative")).toBe(true);
    expect(questions.every((question) => question.answer_type === "likert_1_5")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails when sync inputs diverge**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: FAIL if any normalized question still uses another score direction or answer type

- [ ] **Step 3: Rewrite the sync script to use the normalized artifact**

```js
const { createClient } = require("@supabase/supabase-js");
const normalized = require("../supabase/seeds/nr1-questionnaire.json");

const sections = normalized.sections.map((section) => ({
  id: section.id,
  order: section.order_index,
  name: section.name
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
    order_index: question.order_index
  }))
);
```

- [ ] **Step 4: Re-run tests and verify app compatibility files without changing them unless needed**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: PASS

Run: `rg -n "likert_1_5|scaleLabels|answer_raw between 1 and 5|scoring_direction" src/components/survey/respondent-survey-form.tsx src/lib/server/services/submission-service.ts src/lib/domain/risk/engine.ts`
Expected: confirms the current flow still expects the same scale and score model

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-production-questionnaire.js scripts/lib/nr1-questionnaire-parser.test.js
git commit -m "feat: sync normalized NR-1 questionnaire to supabase"
```

## Task 5: Final Verification and Documentation Refresh

**Files:**
- Modify: `docs/superpowers/specs/2026-04-09-questionario-nr1-planilha-design.md`
- Verify: `supabase/seeds/nr1-questionnaire.json`
- Verify: `supabase/seeds/seed-initial.sql`

- [ ] **Step 1: Add a brief note in the spec pointing to the final artifacts**

```md
## Artefatos Implementados

- `supabase/seeds/source/nr1-questionario.xlsx`
- `supabase/seeds/nr1-questionnaire-editorial.json`
- `supabase/seeds/nr1-questionnaire.json`
- `supabase/seeds/seed-initial.sql`
```

- [ ] **Step 2: Run the focused test suite**

Run: `npm test -- scripts/lib/nr1-questionnaire-parser.test.js`
Expected: PASS

- [ ] **Step 3: Run the broader project verification**

Run: `npm test`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Verify the generated questionnaire artifact manually**

Run: `node -e "const q=require('./supabase/seeds/nr1-questionnaire.json'); console.log({sections:q.sections.length, questions:q.sections.flatMap(s=>s.questions).length, first:q.sections[0].name, last:q.sections[q.sections.length-1].name});"`
Expected: prints `sections: 12` and a non-zero `questions` count

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-09-questionario-nr1-planilha-design.md supabase/seeds/nr1-questionnaire.json supabase/seeds/seed-initial.sql
git commit -m "chore: finalize NR-1 questionnaire workbook migration"
```

## Self-Review

### Spec coverage

- Fonte canonica versionada: coberta em Task 1 e Task 2.
- Conversao para formato interno: coberta em Task 2.
- Seed e sincronizacao sem catalogo antigo: coberta em Task 3 e Task 4.
- Estrutura final com 12 secoes: coberta em Task 2 e verificada em Task 5.
- `scoring_direction = 'negative'` e escala `1..5`: coberta em Task 2, Task 4 e Task 5.
- Compatibilidade com o fluxo atual do respondente: coberta em Task 4 e Task 5.

### Placeholder scan

- Nenhum `TODO`, `TBD` ou referencia vaga foi deixado nas tarefas.
- Cada tarefa inclui arquivos, testes, comandos e resultado esperado.

### Type consistency

- O artefato normalizado usa `answer_type`, `scoring_direction`, `weight`, `is_required`, `is_active`, `order_index`, que sao os mesmos nomes consumidos pelos scripts e compativeis com o banco.
- O plano usa `likert_1_5` e `negative` de forma consistente em todas as tarefas.
