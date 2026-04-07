import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { createQuestionnaireDraft, listQuestionnaires } from "@/lib/server/repositories/questionnaire-repository";

export async function GET(request: Request) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const items = await listQuestionnaires(status);
    return NextResponse.json({ items });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePortalApiSession(["admin"]);
    const body = await request.json();
    const { name, version } = body;

    if (!name?.trim()) throw new Error("MISSING_REQUIRED_FIELDS");

    const questionnaire = await createQuestionnaireDraft(
      name.trim(),
      (version?.trim()) || "v1"
    );
    return NextResponse.json({ questionnaire }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
