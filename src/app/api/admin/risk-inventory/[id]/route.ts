import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { deleteRiskInventoryService, updateRiskInventoryService } from "@/lib/server/services/risk-inventory-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;
    const body = await request.json();
    const item = await updateRiskInventoryService({ ...body, id }, actor);
    return NextResponse.json({ item });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin"]);
    const { id } = await context.params;
    await deleteRiskInventoryService(id, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
