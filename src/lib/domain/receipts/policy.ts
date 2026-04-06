const RECEIPT_TTL_DAYS = 30;
const RECEIPT_TTL_MS = RECEIPT_TTL_DAYS * 24 * 60 * 60 * 1000;

export function getReceiptTtlDays() {
  return RECEIPT_TTL_DAYS;
}

export function buildReceiptExpiresAt(submittedAt = new Date()) {
  return new Date(submittedAt.getTime() + RECEIPT_TTL_MS).toISOString();
}

export function isReceiptExpired(receiptExpiresAt: string, now = new Date()) {
  return new Date(receiptExpiresAt).getTime() <= now.getTime();
}
