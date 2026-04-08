import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { createRiskInventoryRevisionService } from "@/lib/server/services/risk-inventory-service";

export async function POST(request: Request) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr"]);
    const body = await request.json();
    const revision = await createRiskInventoryRevisionService(actor, body);
    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
