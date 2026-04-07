import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import {
  deleteQuestionnaire,
  getQuestionnaireWithSections,
  saveQuestionnaire
} from "@/lib/server/repositories/questionnaire-repository";
import type { SectionInput } from "@/lib/server/repositories/questionnaire-repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    const questionnaire = await getQuestionnaireWithSections(id);
    if (!questionnaire) throw new Error("NOT_FOUND");
    return NextResponse.json({ questionnaire });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin"]);
    const { id } = await context.params;

    const body = await request.json();
    const { name, version, sections } = body;

    if (!name?.trim()) throw new Error("MISSING_REQUIRED_FIELDS");
    if (!Array.isArray(sections)) throw new Error("INVALID_SECTIONS");

    await saveQuestionnaire(id, {
      name: name.trim(),
      version: (version?.trim()) || "v1",
      sections: sections as SectionInput[]
    });

    const updated = await getQuestionnaireWithSections(id);
    return NextResponse.json({ questionnaire: updated });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin"]);
    const { id } = await context.params;
    await deleteQuestionnaire(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
