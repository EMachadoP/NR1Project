import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { exportRiskInventoryVersionService } from "@/lib/server/services/risk-inventory-service";

type RouteContext = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { versionId } = await context.params;
    const payload = await exportRiskInventoryVersionService(actor, versionId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_NOT_EXPORTABLE") {
      return NextResponse.json({ error: "Apenas revisoes published podem ser exportadas." }, { status: 409 });
    }

    return toApiErrorResponse(error);
  }
}
