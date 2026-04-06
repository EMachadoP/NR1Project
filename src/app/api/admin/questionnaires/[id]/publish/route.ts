import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;

    return NextResponse.json({
      id,
      message: "Publish questionnaire only after validating scoring_direction for every active question."
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
