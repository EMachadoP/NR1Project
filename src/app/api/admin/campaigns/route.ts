import { NextResponse } from "next/server";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET() {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const items = await listCampaignsService(actor);
    return NextResponse.json({ items });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
