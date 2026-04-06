import { z } from "zod";

const severitySchema = z.enum(["MUITO BAIXO", "BAIXO", "MEDIO", "ALTO", "CRITICO"]);

export const COMPANY_RULE_CODES = [
  "PRIORITIZE_IMMEDIATE_ACTION_FOR_CRITICAL",
  "REQUIRE_HUMAN_VALIDATION_FOR_HIGH_RISK",
  "PROHIBIT_MEDICAL_DIAGNOSIS",
  "PROHIBIT_BLAME_ASSIGNMENT",
  "FOCUS_ON_PREVENTIVE_MEASURES",
  "USE_ACTION_PLAN_AS_OFFICIAL_TRACKING",
  "REQUIRE_PERIODIC_MONITORING"
] as const;

export const companyRuleCodeSchema = z.enum(COMPANY_RULE_CODES);

export const aiRecommendationsInputSchema = z.object({
  campaign: z.object({
    id: z.string(),
    name: z.string(),
    sector: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    language: z.string().default("pt-BR")
  }).strict(),
  summary: z.object({
    responseCount: z.number().int().nonnegative(),
    criticalItemsCount: z.number().int().nonnegative(),
    sectionCount: z.number().int().nonnegative()
  }).strict(),
  sections: z.array(
    z.object({
      sectionId: z.string(),
      average: z.number().min(1).max(5),
      label: severitySchema,
      responseCount: z.number().int().nonnegative(),
      criticalItemCount: z.number().int().nonnegative()
    }).strict()
  ).min(1),
  criticalItems: z.array(
    z.object({
      questionId: z.string(),
      sectionId: z.string(),
      riskValue: z.number().min(1).max(5)
    }).strict()
  ).default([]),
  companyRules: z.array(companyRuleCodeSchema).default([]),
  existingActionPlan: z.array(
    z.object({
      riskIdentified: z.string(),
      sectionName: z.string().nullable().optional(),
      measure: z.string(),
      ownerName: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      status: z.string()
    }).strict()
  ).default([])
}).strict();

export const aiSuggestedActionSchema = z.object({
  priority: z.enum(["immediate", "short_term", "planned"]),
  sectionId: z.string(),
  riskIdentified: z.string().min(3),
  rootCauseSuggestion: z.string().min(3),
  preventiveMeasureSuggestion: z.string().min(3),
  dueDateSuggestion: z.string().min(3),
  monitoringFrequencySuggestion: z.string().min(3),
  requiresHumanValidation: z.boolean(),
  rationale: z.string().min(3)
}).strict();

export const aiRecommendationsOutputSchema = z.object({
  executiveSummary: z.string().min(20),
  recommendations: z.array(aiSuggestedActionSchema).min(1),
  guardrailsApplied: z.object({
    noMedicalDiagnosis: z.literal(true),
    noBlameAssignment: z.literal(true),
    humanValidationRequiredForHighRisk: z.literal(true),
    companyRulesConsidered: z.literal(true)
  }).strict(),
  fallbackUsed: z.boolean().default(false),
  promptVersion: z.string().min(1)
}).strict();

export type CompanyRuleCode = z.infer<typeof companyRuleCodeSchema>;
export type AiRecommendationsInput = z.infer<typeof aiRecommendationsInputSchema>;
export type AiRecommendationsOutput = z.infer<typeof aiRecommendationsOutputSchema>;
