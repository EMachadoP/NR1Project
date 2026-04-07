import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { generateTokens } from "@/lib/server/services/token-service";
import { generateQR } from "@/lib/server/services/qr-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id: campaignId } = await context.params;

    const body = await request.json();
    const count = Number(body?.count);

    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      throw new Error("INVALID_COUNT");
    }

    const supabase = createAdminSupabaseClient();
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();

    if (!campaign) {
      throw new Error("NOT_FOUND");
    }

    const origin = new URL(request.url).origin;
    const tokenList = await generateTokens(campaignId, count, origin);

    const tokens = await Promise.all(
      tokenList.map(async ({ token, url }) => ({
        token,
        url,
        qrCode: await generateQR(url)
      }))
    );

    return NextResponse.json({ tokens }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
