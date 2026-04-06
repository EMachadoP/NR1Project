type RateLimitWindow = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitWindow>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function consumeRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = params.now ?? Date.now();
  const existing = rateLimitStore.get(params.key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs
    });

    return {
      allowed: true,
      remaining: Math.max(params.limit - 1, 0),
      retryAfterSeconds: Math.ceil(params.windowMs / 1000)
    };
  }

  if (existing.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1)
    };
  }

  existing.count += 1;
  rateLimitStore.set(params.key, existing);

  return {
    allowed: true,
    remaining: Math.max(params.limit - existing.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1)
  };
}

export function resetRateLimitStoreForTests() {
  rateLimitStore.clear();
}
