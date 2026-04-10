import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";
import { deleteCampaign } from "@/lib/server/repositories/campaigns-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin", "hr", "manager"]);
    const { id } = await context.params;

    return NextResponse.json({
      id,
      message: "Fetch campaign detail."
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
      message: "Update campaign detail."
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requirePortalApiSession(["admin"]);
    const { id } = await context.params;
    await deleteCampaign(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
