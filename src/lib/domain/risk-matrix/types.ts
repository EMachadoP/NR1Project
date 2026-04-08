export const RISK_MATRIX_SCORE_MIN = 1;
export const RISK_MATRIX_SCORE_MAX = 5;

export type RiskMatrixScore =
  | 1
  | 2
  | 3
  | 4
  | 5;

export type RiskMatrixInput = {
  probability: RiskMatrixScore;
  severity: RiskMatrixScore;
};

export type NroClassification = {
  label: "Baixo" | "Medio" | "Alto" | "Critico";
  colorToken: "green" | "yellow" | "orange" | "red";
};

export type NroClassificationThreshold = NroClassification & {
  min: number;
};

export const NRO_CLASSIFICATION_THRESHOLDS: readonly NroClassificationThreshold[] = [
  { min: 15, label: "Critico", colorToken: "red" },
  { min: 10, label: "Alto", colorToken: "orange" },
  { min: 5, label: "Medio", colorToken: "yellow" },
  { min: 1, label: "Baixo", colorToken: "green" },
] as const;
