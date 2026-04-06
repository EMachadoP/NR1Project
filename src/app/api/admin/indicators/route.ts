import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { createIndicatorService, listIndicatorsService } from "@/lib/server/services/indicator-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId") ?? undefined;
    const items = await listIndicatorsService(actor, campaignId);
    return NextResponse.json({ items });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const body = await request.json();
    const item = await createIndicatorService(body, actor);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
