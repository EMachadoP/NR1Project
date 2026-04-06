export const forbiddenAnonymousFields = ["name", "cpf", "phone", "employee_id"] as const;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_PATTERN = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}\b/g;
const EMPLOYEE_ID_PATTERN = /\b(?:matricula|matr[ií]cula|registro|employee[_\s-]?id)\s*[:#-]?\s*[A-Z0-9-]{3,}\b/gi;

export function assertAnonymousPayload<T extends Record<string, unknown>>(payload: T) {
  for (const field of forbiddenAnonymousFields) {
    if (field in payload && payload[field] != null && payload[field] !== "") {
      throw new Error(`Anonymous mode cannot persist personal identifier field: ${field}`);
    }
  }

  return payload;
}

export function redactAnonymousObservationText(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  return input
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(CPF_PATTERN, "[redacted-cpf]")
    .replace(PHONE_PATTERN, "[redacted-phone]")
    .replace(EMPLOYEE_ID_PATTERN, "[redacted-employee-id]")
    .trim();
}
