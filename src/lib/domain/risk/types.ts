export const RISK_LABELS = ["MUITO BAIXO", "BAIXO", "MEDIO", "ALTO", "CRITICO"] as const;

export type RiskLabel = (typeof RISK_LABELS)[number];

export type ScoringDirection = "positive" | "negative";

export type QuestionRiskInput = {
  questionId: string;
  sectionId: string;
  answer?: number | null;
  scoringDirection: ScoringDirection;
  weight?: number;
  isRequired?: boolean;
};

export type NormalizedQuestionRisk = {
  questionId: string;
  sectionId: string;
  answer: number;
  scoringDirection: ScoringDirection;
  weight: number;
  riskValue: number;
  isCritical: boolean;
};

export type SectionRiskSummary = {
  sectionId: string;
  average: number;
  label: RiskLabel;
  answeredQuestions: number;
  skippedOptionalQuestions: number;
  criticalItems: NormalizedQuestionRisk[];
  items: NormalizedQuestionRisk[];
};

export type ResponseRiskSummary = {
  sectionSummaries: SectionRiskSummary[];
  criticalItems: NormalizedQuestionRisk[];
  totalQuestions: number;
  answeredQuestions: number;
  skippedOptionalQuestions: number;
};

export type CampaignSectionAggregate = {
  sectionId: string;
  average: number;
  label: RiskLabel;
  responseCount: number;
  criticalItemCount: number;
};

export type CampaignRiskSummary = {
  sectionSummaries: CampaignSectionAggregate[];
  criticalItems: NormalizedQuestionRisk[];
  responseCount: number;
};
