import { z } from "zod";
import type {
  CampaignRiskSummary,
  CampaignSectionAggregate,
  NormalizedQuestionRisk,
  QuestionRiskInput,
  ResponseRiskSummary,
  RiskLabel,
  ScoringDirection,
  SectionRiskSummary
} from "@/lib/domain/risk/types";

export const riskClassificationScale: Array<{
  min: number;
  max: number;
  label: RiskLabel;
}> = [
  { min: 1.0, max: 1.5, label: "MUITO BAIXO" },
  { min: 1.6, max: 2.5, label: "BAIXO" },
  { min: 2.6, max: 3.5, label: "MEDIO" },
  { min: 3.6, max: 4.5, label: "ALTO" },
  { min: 4.6, max: 5.0, label: "CRITICO" }
];

export const DEFAULT_QUESTION_WEIGHT = 1;
export const riskAnswerSchema = z.number().int().min(1).max(5);
export const scoringDirectionSchema = z.enum(["positive", "negative"]);
export const questionWeightSchema = z.number().positive();

export function normalizeRisk(answer: number, scoringDirection: ScoringDirection) {
  const validatedAnswer = riskAnswerSchema.parse(answer);
  const validatedDirection = scoringDirectionSchema.parse(scoringDirection);

  return validatedDirection === "positive" ? 6 - validatedAnswer : validatedAnswer;
}

export function normalizeQuestionWeight(weight?: number) {
  return questionWeightSchema.parse(weight ?? DEFAULT_QUESTION_WEIGHT);
}

export function isCriticalRisk(riskValue: number) {
  return riskValue >= 4;
}

export function classifySectionRisk(sectionAverage: number) {
  const rounded = Number(sectionAverage.toFixed(1));
  const scaled = Math.round(rounded * 10);

  if (scaled >= 10 && scaled <= 15) {
    return { average: rounded, label: "MUITO BAIXO" as const };
  }

  if (scaled >= 16 && scaled <= 25) {
    return { average: rounded, label: "BAIXO" as const };
  }

  if (scaled >= 26 && scaled <= 35) {
    return { average: rounded, label: "MEDIO" as const };
  }

  if (scaled >= 36 && scaled <= 45) {
    return { average: rounded, label: "ALTO" as const };
  }

  if (scaled >= 46 && scaled <= 50) {
    return { average: rounded, label: "CRITICO" as const };
  }

  throw new Error(`Section average out of supported range: ${sectionAverage}`);
}

export function normalizeQuestionRisk(input: QuestionRiskInput): NormalizedQuestionRisk {
  if (input.answer == null) {
    throw new Error(`Question answer is required for normalization: ${input.questionId}`);
  }

  const weight = normalizeQuestionWeight(input.weight);
  const riskValue = normalizeRisk(input.answer, input.scoringDirection);

  return {
    questionId: input.questionId,
    sectionId: input.sectionId,
    answer: input.answer,
    scoringDirection: input.scoringDirection,
    weight,
    riskValue,
    isCritical: isCriticalRisk(riskValue)
  };
}

export function calculateSectionRisk(inputs: QuestionRiskInput[]): SectionRiskSummary {
  if (inputs.length === 0) {
    throw new Error("Section risk requires at least one configured question.");
  }

  const sectionId = inputs[0].sectionId;

  if (inputs.some((input) => input.sectionId !== sectionId)) {
    throw new Error("Section risk inputs must belong to the same section.");
  }

  const unansweredRequired = inputs.find((input) => (input.isRequired ?? true) && input.answer == null);
  if (unansweredRequired) {
    throw new Error(`Required question is unanswered: ${unansweredRequired.questionId}`);
  }

  const skippedOptionalQuestions = inputs.filter((input) => !(input.isRequired ?? true) && input.answer == null).length;
  const answeredInputs = inputs.filter((input) => input.answer != null);

  if (answeredInputs.length === 0) {
    throw new Error(`Section has no answered questions after excluding optional blanks: ${sectionId}`);
  }

  const items = answeredInputs.map(normalizeQuestionRisk);
  const weightedTotal = items.reduce((sum, item) => sum + item.riskValue * item.weight, 0);
  const weightSum = items.reduce((sum, item) => sum + item.weight, 0);
  const classification = classifySectionRisk(weightedTotal / weightSum);

  return {
    sectionId,
    average: classification.average,
    label: classification.label,
    answeredQuestions: items.length,
    skippedOptionalQuestions,
    criticalItems: items.filter((item) => item.isCritical),
    items
  };
}

export function consolidateResponseRisk(inputs: QuestionRiskInput[]): ResponseRiskSummary {
  if (inputs.length === 0) {
    throw new Error("Response consolidation requires at least one configured question.");
  }

  const groupedBySection = new Map<string, QuestionRiskInput[]>();

  for (const input of inputs) {
    const sectionInputs = groupedBySection.get(input.sectionId) ?? [];
    sectionInputs.push(input);
    groupedBySection.set(input.sectionId, sectionInputs);
  }

  const sectionSummaries = Array.from(groupedBySection.values())
    .map((sectionInputs) => {
      const answeredInSection = sectionInputs.some((input) => input.answer != null);
      const hasRequiredQuestion = sectionInputs.some((input) => input.isRequired ?? true);

      if (!answeredInSection && !hasRequiredQuestion) {
        return null;
      }

      return calculateSectionRisk(sectionInputs);
    })
    .filter((section): section is SectionRiskSummary => section !== null)
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId));

  if (sectionSummaries.length === 0) {
    throw new Error("Response consolidation requires at least one answered question.");
  }

  return {
    sectionSummaries,
    criticalItems: sectionSummaries.flatMap((section) => section.criticalItems),
    totalQuestions: inputs.length,
    answeredQuestions: sectionSummaries.reduce((sum, section) => sum + section.answeredQuestions, 0),
    skippedOptionalQuestions: sectionSummaries.reduce((sum, section) => sum + section.skippedOptionalQuestions, 0)
  };
}

export function consolidateCampaignRisk(responses: ResponseRiskSummary[]): CampaignRiskSummary {
  if (responses.length === 0) {
    throw new Error("Campaign consolidation requires at least one response.");
  }

  const groupedBySection = new Map<string, SectionRiskSummary[]>();

  for (const response of responses) {
    for (const section of response.sectionSummaries) {
      const items = groupedBySection.get(section.sectionId) ?? [];
      items.push(section);
      groupedBySection.set(section.sectionId, items);
    }
  }

  const sectionSummaries: CampaignSectionAggregate[] = Array.from(groupedBySection.entries())
    .map(([sectionId, summaries]) => {
      const average = summaries.reduce((sum, summary) => sum + summary.average, 0) / summaries.length;
      const classification = classifySectionRisk(average);

      return {
        sectionId,
        average: classification.average,
        label: classification.label,
        responseCount: summaries.length,
        criticalItemCount: summaries.reduce((sum, summary) => sum + summary.criticalItems.length, 0)
      };
    })
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId));

  return {
    sectionSummaries,
    criticalItems: responses.flatMap((response) => response.criticalItems),
    responseCount: responses.length
  };
}
