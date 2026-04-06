import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { deleteActionPlanService, updateActionPlanService } from "@/lib/server/services/action-plan-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    const body = await request.json();
    const item = await updateActionPlanService({ ...body, id }, actor);
    return NextResponse.json({ item });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    await deleteActionPlanService(id, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
