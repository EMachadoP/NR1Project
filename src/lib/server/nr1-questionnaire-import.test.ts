import path from "node:path";
import { describe, expect, it } from "vitest";

type ParserModule = {
  parseWorkbookSections: (workbookPath: string) => {
    scaleLabels: string[];
    sections: Array<{
      name: string;
      questions: Array<{ prompt: string }>;
    }>;
  };
  buildNormalizedQuestionnaire: (
    workbookData: ReturnType<ParserModule["parseWorkbookSections"]>,
    editorialData: {
      questionnaire: { name: string; version: string };
      sections: Array<{ name: string; questions: Array<{ prompt: string }> }>;
    }
  ) => {
    questionnaire: { name: string };
    warnings: string[];
    sections: Array<{
      id: string;
      questions: Array<Record<string, unknown>>;
    }>;
  };
};

describe("NR-1 questionnaire import", () => {
  it("extracts the visible sections and scale labels from the workbook", async () => {
    const parserModule = require("../../../scripts/lib/nr1-questionnaire-parser.js") as ParserModule;
    const workbookPath = path.resolve("supabase/seeds/source/nr1-questionario.xlsx");

    const parsed = parserModule.parseWorkbookSections(workbookPath);

    expect(parsed.scaleLabels).toEqual(["Nunca", "Raramente", "As vezes", "frequentemente", "Sempre"]);
    expect(parsed.sections.length).toBeGreaterThanOrEqual(8);
    expect(parsed.sections[0]).toMatchObject({
      name: "ORGANIZACAO DO TRABALHO E JORNADA"
    });
    expect(parsed.sections[0].questions[0]).toMatchObject({
      prompt: "Consigo cumprir minha jornada de trabalho sem necessidade frequente de horas extras"
    });
  });

  it("builds a normalized 12-section questionnaire with negative scoring", async () => {
    const parserModule = require("../../../scripts/lib/nr1-questionnaire-parser.js") as ParserModule;
    const workbookPath = path.resolve("supabase/seeds/source/nr1-questionario.xlsx");

    const parsed = parserModule.parseWorkbookSections(workbookPath);
    const normalized = parserModule.buildNormalizedQuestionnaire(parsed, {
      questionnaire: {
        name: "Questionario NR-1 - Setor de Costura",
        version: "v3.0.0",
      },
      sections: [
        {
          name: "RISCOS ERGONOMICOS",
          questions: [{ prompt: "Meu posto de trabalho permite postura adequada durante a costura." }],
        },
        {
          name: "RISCOS AMBIENTAIS",
          questions: [{ prompt: "A ventilacao do ambiente de trabalho e adequada durante a jornada." }],
        },
        {
          name: "RISCOS QUIMICOS/BIOLOGICOS",
          questions: [{ prompt: "Recebo orientacao segura para lidar com materiais e residuos do processo." }],
        },
        {
          name: "REPETITIVIDADE",
          questions: [{ prompt: "Consigo alternar movimentos ou tarefas para reduzir repeticao excessiva." }],
        },
      ],
    });

    expect(normalized.questionnaire.name).toBe("Questionario NR-1 - Setor de Costura");
    expect(normalized.sections).toHaveLength(12);
    expect(normalized.warnings.some((warning: string) => warning.includes("diverg"))).toBe(true);

    const questions = normalized.sections.flatMap((section: { questions: Array<Record<string, unknown>> }) => section.questions);
    expect(questions.length).toBeGreaterThanOrEqual(35);
    expect(
      normalized.sections.every((section: { id: string }) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(section.id)
      )
    ).toBe(true);
    expect(
      questions.every((question: Record<string, unknown>) =>
        typeof question.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(question.id as string) &&
        question.answer_type === "likert_1_5" &&
        question.scoring_direction === "negative" &&
        question.weight === 1 &&
        question.is_required === true &&
        question.is_active === true
      )
    ).toBe(true);
  });
});
