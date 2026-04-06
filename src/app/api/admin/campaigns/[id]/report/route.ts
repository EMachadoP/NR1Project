import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { generateAnalyticalReport } from "@/lib/server/services/report-service";
import { getCampaign } from "@/lib/server/repositories/campaigns-repository";
import { assertCampaignScope } from "@/lib/auth/authorization";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { id } = await context.params;
    const campaign = await getCampaign(id);
    assertCampaignScope(actor, campaign);
    const item = await generateAnalyticalReport(id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
