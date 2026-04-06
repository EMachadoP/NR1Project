import { describe, expect, it } from "vitest";
import { buildReceiptExpiresAt, getReceiptTtlDays, isReceiptExpired } from "@/lib/domain/receipts/policy";

describe("receipt policy", () => {
  it("builds expiration using the fixed receipt ttl", () => {
    const submittedAt = new Date("2026-04-06T12:00:00.000Z");
    const expiresAt = buildReceiptExpiresAt(submittedAt);

    expect(expiresAt).toBe("2026-05-06T12:00:00.000Z");
    expect(getReceiptTtlDays()).toBe(30);
  });

  it("detects expired receipts", () => {
    expect(isReceiptExpired("2026-04-06T12:00:00.000Z", new Date("2026-04-06T12:00:00.000Z"))).toBe(true);
    expect(isReceiptExpired("2026-04-06T12:00:01.000Z", new Date("2026-04-06T12:00:00.000Z"))).toBe(false);
  });
});
