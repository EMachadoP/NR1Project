import { describe, expect, it } from "vitest";
import { createReceiptCode, hashAnonymousToken } from "@/lib/server/crypto";

describe("server crypto", () => {
  it("hashes anonymous tokens deterministically", () => {
    expect(hashAnonymousToken("token-123")).toBe(hashAnonymousToken("token-123"));
    expect(hashAnonymousToken("token-123")).not.toBe(hashAnonymousToken("token-456"));
  });

  it("creates opaque receipt codes that do not expose internal ids", () => {
    const receiptCode = createReceiptCode();

    expect(receiptCode).toMatch(/^NR1-[A-F0-9]{20}$/);
  });
});
