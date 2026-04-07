import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { generateAnalyticalReport } from "@/lib/server/services/report-service";
import { createSignedReportUrl } from "@/lib/server/pdf/report-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id: campaignId } = await context.params;

    const report = await generateAnalyticalReport(campaignId);

    if (report.status !== "done" || !report.storage_path) {
      throw new Error(report.error_message ?? "REPORT_GENERATION_FAILED");
    }

    const signedUrl = await createSignedReportUrl(report.storage_path);

    return NextResponse.json({ report, signedUrl }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
