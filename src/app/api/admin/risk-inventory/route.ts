import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { createRiskInventoryService, listRiskInventoryService } from "@/lib/server/services/risk-inventory-service";

export async function GET(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { searchParams } = new URL(request.url);
    const items = await listRiskInventoryService(actor, {
      campaignId: searchParams.get("campaignId") ?? undefined,
      riskClassification: searchParams.get("riskClassification") ?? undefined
    });

    return NextResponse.json({ items });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin"]);
    const body = await request.json();
    const item = await createRiskInventoryService(body, actor);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
