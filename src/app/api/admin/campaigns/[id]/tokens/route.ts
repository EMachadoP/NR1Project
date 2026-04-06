import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;

    return NextResponse.json(
      {
        campaignId: id,
        message: "Generate token batch and QR assets."
      },
      {
        status: 201
      }
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
