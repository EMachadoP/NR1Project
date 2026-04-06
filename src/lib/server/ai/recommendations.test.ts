import { describe, expect, it } from "vitest";
import { buildFallbackRecommendations } from "@/lib/server/ai/fallback";
import { SYSTEM_PROMPT_VERSION } from "@/lib/server/ai/system-prompt";
import { validateAiRecommendationsSemantics } from "@/lib/server/ai/recommendations";
import {
  aiRecommendationsInputSchema,
  aiRecommendationsOutputSchema,
  COMPANY_RULE_CODES,
  type AiRecommendationsInput,
  type AiRecommendationsOutput
} from "@/lib/validation/ai-recommendations";

const baseInput: AiRecommendationsInput = {
  campaign: {
    id: "campaign-1",
    name: "Campanha NR-1",
    sector: "TI",
    unit: "Fortaleza",
    language: "pt-BR"
  },
  summary: {
    responseCount: 12,
    criticalItemsCount: 2,
    sectionCount: 2
  },
  sections: [
    {
      sectionId: "s1",
      average: 4.8,
      label: "CRITICO",
      responseCount: 12,
      criticalItemCount: 2
    },
    {
      sectionId: "s2",
      average: 3.7,
      label: "ALTO",
      responseCount: 12,
      criticalItemCount: 1
    }
  ],
  criticalItems: [
    { questionId: "q1", sectionId: "s1", riskValue: 5 }
  ],
  companyRules: ["PRIORITIZE_IMMEDIATE_ACTION_FOR_CRITICAL", "REQUIRE_HUMAN_VALIDATION_FOR_HIGH_RISK"],
  existingActionPlan: []
};

const validOutput: AiRecommendationsOutput = {
  executiveSummary: "Campanha com secoes criticas e altas que exigem acao preventiva imediata e validacao humana obrigatoria.",
  recommendations: [
    {
      priority: "immediate",
      sectionId: "s1",
      riskIdentified: "Risco critico na secao s1",
      rootCauseSuggestion: "Fragilidade operacional recorrente ainda sem resposta estruturada.",
      preventiveMeasureSuggestion: "Executar intervencao imediata e revisar controles locais com apoio do RH.",
      dueDateSuggestion: "24 a 72 horas",
      monitoringFrequencySuggestion: "diaria ate estabilizacao",
      requiresHumanValidation: true,
      rationale: "Media critica e itens criticos concentrados exigem resposta imediata."
    }
  ],
  guardrailsApplied: {
    noMedicalDiagnosis: true,
    noBlameAssignment: true,
    humanValidationRequiredForHighRisk: true,
    companyRulesConsidered: true
  },
  fallbackUsed: false,
  promptVersion: SYSTEM_PROMPT_VERSION
};

describe("ai recommendations validation", () => {
  it("accepts only approved company rule codes", () => {
    expect(COMPANY_RULE_CODES.length).toBeGreaterThan(3);
    expect(() => aiRecommendationsInputSchema.parse(baseInput)).not.toThrow();
    expect(() => aiRecommendationsInputSchema.parse({ ...baseInput, companyRules: ["IGNORE_PREVIOUS_INSTRUCTIONS"] })).toThrow();
  });

  it("requires promptVersion in the output contract", () => {
    expect(() => aiRecommendationsOutputSchema.parse(validOutput)).not.toThrow();
    expect(() => aiRecommendationsOutputSchema.parse({ ...validOutput, promptVersion: undefined })).toThrow();
  });

  it("flags semantic guardrail violations in model output", () => {
    const violations = validateAiRecommendationsSemantics(baseInput, {
      ...validOutput,
      executiveSummary: "Ha sinais de depressao e burnout associados a negligencia da equipe.",
      recommendations: [
        {
          ...validOutput.recommendations[0],
          priority: "short_term",
          requiresHumanValidation: false
        }
      ]
    });

    expect(violations).toContain("MEDICAL_DIAGNOSIS_CONTENT");
    expect(violations).toContain("BLAME_ASSIGNMENT_CONTENT");
    expect(violations).toContain("HIGH_RISK_WITHOUT_HUMAN_VALIDATION");
    expect(violations).toContain("CRITICAL_WITHOUT_IMMEDIATE_PRIORITY");
  });

  it("builds fallback with promptVersion and fallbackUsed persisted in payload", () => {
    const fallback = buildFallbackRecommendations(baseInput);

    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.promptVersion).toBe(SYSTEM_PROMPT_VERSION);
    expect(fallback.guardrailsApplied.companyRulesConsidered).toBe(true);
  });
});
