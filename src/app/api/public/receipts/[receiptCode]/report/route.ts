import { NextResponse } from "next/server";
import { getPublicReportLink } from "@/lib/server/services/report-service";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET(_request: Request, context: { params: Promise<{ receiptCode: string }> }) {
  try {
    const { receiptCode } = await context.params;
    const item = await getPublicReportLink(receiptCode);
    return NextResponse.json(item);
  } catch (error) {
    return toApiErrorResponse(error, "REPORT_NOT_READY");
  }
}
