import { NextResponse } from "next/server";
import { requirePortalApiSession } from "@/lib/auth/session";
import { toApiErrorResponse } from "@/lib/server/http/errors";

export async function GET() {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    return NextResponse.json({
      items: [],
      message: "List questionnaires."
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST() {
  try {
    await requirePortalApiSession(["admin", "hr"]);
    return NextResponse.json(
      {
        message: "Create questionnaire draft."
      },
      {
        status: 201
      }
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
