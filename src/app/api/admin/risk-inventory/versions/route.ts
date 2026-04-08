import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { listRiskInventoryVersionsService } from "@/lib/server/services/risk-inventory-service";

export async function GET(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      throw new Error("INVALID_CAMPAIGN_ID");
    }

    const versions = await listRiskInventoryVersionsService(actor, { campaignId });
    return NextResponse.json({ versions });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
