import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { generateAiRecommendations } from "@/lib/server/ai/recommendations";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { writeAuditLog } from "@/lib/server/audit/logging";
import { consumeRateLimit } from "@/lib/server/security/rate-limit";

const AI_RATE_LIMIT_MAX_REQUESTS = 10;
const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const rateLimit = consumeRateLimit({
      key: `ai-recommendations:${actor.userId}`,
      limit: AI_RATE_LIMIT_MAX_REQUESTS,
      windowMs: AI_RATE_LIMIT_WINDOW_MS
    });

    if (!rateLimit.allowed) {
      await writeAuditLog({
        actor,
        entityType: "ai_recommendations",
        entityId: actor.userId,
        action: "rate_limit_exceeded",
        afterJson: {
          limit: AI_RATE_LIMIT_MAX_REQUESTS,
          windowMs: AI_RATE_LIMIT_WINDOW_MS,
          retryAfterSeconds: rateLimit.retryAfterSeconds
        }
      });

      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds)
          }
        }
      );
    }

    const body = await request.json();
    const item = await generateAiRecommendations(body, actor);
    return NextResponse.json(
      { item },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        }
      }
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
