import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { deleteIndicatorService, updateIndicatorService } from "@/lib/server/services/indicator-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    const body = await request.json();
    const item = await updateIndicatorService({ ...body, id }, actor);
    return NextResponse.json({ item });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    await deleteIndicatorService(id, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
