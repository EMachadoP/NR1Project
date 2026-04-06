import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";

export function hashAnonymousToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createReceiptCode() {
  return `NR1-${randomBytes(10).toString("hex").toUpperCase()}`;
}
