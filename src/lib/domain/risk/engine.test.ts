import { describe, expect, it } from "vitest";
import {
  calculateSectionRisk,
  classifySectionRisk,
  consolidateCampaignRisk,
  consolidateResponseRisk,
  DEFAULT_QUESTION_WEIGHT,
  isCriticalRisk,
  normalizeQuestionRisk,
  normalizeQuestionWeight,
  normalizeRisk
} from "@/lib/domain/risk/engine";
import type { QuestionRiskInput } from "@/lib/domain/risk/types";

const responseA: QuestionRiskInput[] = [
  { questionId: "q1", sectionId: "s1", answer: 5, scoringDirection: "positive", isRequired: true },
  { questionId: "q2", sectionId: "s1", answer: 4, scoringDirection: "negative", isRequired: true },
  { questionId: "q3", sectionId: "s2", answer: 2, scoringDirection: "negative", isRequired: true }
];

const responseB: QuestionRiskInput[] = [
  { questionId: "q1b", sectionId: "s1", answer: 4, scoringDirection: "positive", isRequired: true },
  { questionId: "q2b", sectionId: "s1", answer: 5, scoringDirection: "negative", isRequired: true },
  { questionId: "q3b", sectionId: "s2", answer: 5, scoringDirection: "positive", isRequired: true }
];

describe("risk engine", () => {
  it("normalizes positive answers as 6 - answer", () => {
    expect(normalizeRisk(5, "positive")).toBe(1);
    expect(normalizeRisk(2, "positive")).toBe(4);
  });

  it("normalizes negative answers as answer", () => {
    expect(normalizeRisk(5, "negative")).toBe(5);
    expect(normalizeRisk(2, "negative")).toBe(2);
  });

  it("rejects answers outside the 1..5 scale", () => {
    expect(() => normalizeRisk(0, "negative")).toThrow();
    expect(() => normalizeRisk(6, "positive")).toThrow();
  });

  it("detects critical items at risk >= 4", () => {
    expect(isCriticalRisk(4)).toBe(true);
    expect(isCriticalRisk(3.9)).toBe(false);
  });

  it("uses weight 1 as the official default and rejects non-positive weights", () => {
    expect(normalizeQuestionWeight()).toBe(DEFAULT_QUESTION_WEIGHT);
    expect(normalizeQuestionWeight(2)).toBe(2);
    expect(() => normalizeQuestionWeight(0)).toThrow();
  });

  it("normalizes a question with weight and critical flag", () => {
    expect(
      normalizeQuestionRisk({
        questionId: "q1",
        sectionId: "s1",
        answer: 2,
        scoringDirection: "positive",
        weight: 2,
        isRequired: true
      })
    ).toEqual({
      questionId: "q1",
      sectionId: "s1",
      answer: 2,
      scoringDirection: "positive",
      weight: 2,
      riskValue: 4,
      isCritical: true
    });
  });

  it("calculates section average and classification", () => {
    const result = calculateSectionRisk([
      { questionId: "q1", sectionId: "s1", answer: 5, scoringDirection: "positive", isRequired: true },
      { questionId: "q2", sectionId: "s1", answer: 4, scoringDirection: "negative", isRequired: true }
    ]);

    expect(result.average).toBe(2.5);
    expect(result.label).toBe("BAIXO");
    expect(result.criticalItems).toHaveLength(1);
  });

  it("applies weighted average as the official MVP semantics", () => {
    const result = calculateSectionRisk([
      { questionId: "q1", sectionId: "s1", answer: 5, scoringDirection: "positive", weight: 3, isRequired: true },
      { questionId: "q2", sectionId: "s1", answer: 5, scoringDirection: "negative", weight: 1, isRequired: true }
    ]);

    expect(result.average).toBe(2);
    expect(result.label).toBe("BAIXO");
  });

  it("excludes unanswered optional questions from section average", () => {
    const result = calculateSectionRisk([
      { questionId: "q1", sectionId: "s1", answer: 5, scoringDirection: "positive", isRequired: true },
      { questionId: "q2", sectionId: "s1", answer: null, scoringDirection: "negative", isRequired: false }
    ]);

    expect(result.average).toBe(1);
    expect(result.answeredQuestions).toBe(1);
    expect(result.skippedOptionalQuestions).toBe(1);
  });

  it("fails when a required question is unanswered", () => {
    expect(() =>
      calculateSectionRisk([
        { questionId: "q1", sectionId: "s1", answer: 5, scoringDirection: "positive", isRequired: true },
        { questionId: "q2", sectionId: "s1", answer: null, scoringDirection: "negative", isRequired: true }
      ])
    ).toThrow("Required question is unanswered");
  });

  it("classifies section averages using exact boundary operators on rounded tenths", () => {
    expect(classifySectionRisk(1.5).label).toBe("MUITO BAIXO");
    expect(classifySectionRisk(1.6).label).toBe("BAIXO");
    expect(classifySectionRisk(2.5).label).toBe("BAIXO");
    expect(classifySectionRisk(2.6).label).toBe("MEDIO");
    expect(classifySectionRisk(3.5).label).toBe("MEDIO");
    expect(classifySectionRisk(3.6).label).toBe("ALTO");
    expect(classifySectionRisk(4.5).label).toBe("ALTO");
    expect(classifySectionRisk(4.6).label).toBe("CRITICO");
  });

  it("consolidates a single response across sections", () => {
    const result = consolidateResponseRisk(responseA);

    expect(result.totalQuestions).toBe(3);
    expect(result.answeredQuestions).toBe(3);
    expect(result.sectionSummaries).toHaveLength(2);
    expect(result.criticalItems).toHaveLength(1);
    expect(result.sectionSummaries.find((item) => item.sectionId === "s1")?.average).toBe(2.5);
    expect(result.sectionSummaries.find((item) => item.sectionId === "s2")?.label).toBe("BAIXO");
  });

  it("consolidates multiple responses at campaign level", () => {
    const result = consolidateCampaignRisk([consolidateResponseRisk(responseA), consolidateResponseRisk(responseB)]);

    expect(result.responseCount).toBe(2);
    expect(result.sectionSummaries).toHaveLength(2);
    expect(result.sectionSummaries.find((item) => item.sectionId === "s1")).toEqual({
      sectionId: "s1",
      average: 3,
      label: "MEDIO",
      responseCount: 2,
      criticalItemCount: 2
    });
    expect(result.sectionSummaries.find((item) => item.sectionId === "s2")).toEqual({
      sectionId: "s2",
      average: 1.5,
      label: "MUITO BAIXO",
      responseCount: 2,
      criticalItemCount: 0
    });
  });
});
