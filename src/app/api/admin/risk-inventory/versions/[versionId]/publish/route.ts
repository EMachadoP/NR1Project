import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { publishRiskInventoryVersionService } from "@/lib/server/services/risk-inventory-service";

type RouteContext = { params: Promise<{ versionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requirePortalApiSession(["admin"]);
    const { versionId } = await context.params;
    const body = await request.json();
    const version = await publishRiskInventoryVersionService(actor, { ...body, versionId });
    return NextResponse.json({ version });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
