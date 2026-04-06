import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { getInternalReportLink } from "@/lib/server/services/report-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const { id } = await context.params;
    const item = await getInternalReportLink(id, actor);
    return NextResponse.json(item);
  } catch (error) {
    return toApiErrorResponse(error, "REPORT_NOT_READY");
  }
}
