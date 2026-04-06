import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimitStoreForTests } from "@/lib/server/security/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("allows requests until the limit and then blocks with retryAfter", () => {
    const now = 1_000;

    expect(consumeRateLimit({ key: "user-1", limit: 2, windowMs: 60_000, now }).allowed).toBe(true);
    expect(consumeRateLimit({ key: "user-1", limit: 2, windowMs: 60_000, now: now + 1 }).allowed).toBe(true);

    const blocked = consumeRateLimit({ key: "user-1", limit: 2, windowMs: 60_000, now: now + 2 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the window after expiration", () => {
    const first = consumeRateLimit({ key: "user-2", limit: 1, windowMs: 1_000, now: 0 });
    const second = consumeRateLimit({ key: "user-2", limit: 1, windowMs: 1_000, now: 500 });
    const third = consumeRateLimit({ key: "user-2", limit: 1, windowMs: 1_000, now: 1_001 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(third.allowed).toBe(true);
  });
});
