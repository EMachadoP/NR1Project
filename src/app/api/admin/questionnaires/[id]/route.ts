import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;

    return NextResponse.json({
      id,
      message: "Fetch questionnaire detail."
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    const { id } = await context.params;

    return NextResponse.json({
      id,
      message: "Update questionnaire draft."
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
