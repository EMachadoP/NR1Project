import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { publishQuestionnaire } from "@/lib/server/repositories/questionnaire-repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin"]);
    const { id } = await context.params;
    const questionnaire = await publishQuestionnaire(id);
    return NextResponse.json({ questionnaire });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
