import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { getCampaignDashboardService } from "@/lib/server/services/dashboard-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { id } = await context.params;
    const item = await getCampaignDashboardService(id, actor);
    return NextResponse.json({ item });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
