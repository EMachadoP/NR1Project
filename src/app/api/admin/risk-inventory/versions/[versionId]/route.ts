import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { getRiskInventoryVersionDetailService } from "@/lib/server/services/risk-inventory-service";

type RouteContext = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { versionId } = await context.params;
    const version = await getRiskInventoryVersionDetailService(actor, versionId);
    return NextResponse.json({ version });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
