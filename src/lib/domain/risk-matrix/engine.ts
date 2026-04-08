import {
  NRO_CLASSIFICATION_THRESHOLDS,
  RISK_MATRIX_SCORE_MAX,
  RISK_MATRIX_SCORE_MIN,
  type NroClassification,
  type RiskMatrixInput,
} from "@/lib/domain/risk-matrix/types";

function assertValidScore(value: number, label: "probability" | "severity"): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer between ${RISK_MATRIX_SCORE_MIN} and ${RISK_MATRIX_SCORE_MAX}.`);
  }

  if (value < RISK_MATRIX_SCORE_MIN || value > RISK_MATRIX_SCORE_MAX) {
    throw new Error(`${label} must be between ${RISK_MATRIX_SCORE_MIN} and ${RISK_MATRIX_SCORE_MAX}.`);
  }
}

function assertValidNro(nro: number): void {
  if (!Number.isInteger(nro) || nro < 1) {
    throw new Error("nro must be a positive integer.");
  }
}

export function computeNro(input: RiskMatrixInput): number {
  assertValidScore(input.probability, "probability");
  assertValidScore(input.severity, "severity");

  return input.probability * input.severity;
}

export function classifyNro(nro: number): NroClassification {
  assertValidNro(nro);

  const classification = NRO_CLASSIFICATION_THRESHOLDS.find((threshold) => nro >= threshold.min);

  if (!classification) {
    throw new Error(`No NRO classification found for value ${nro}.`);
  }

  return {
    label: classification.label,
    colorToken: classification.colorToken,
  };
}
