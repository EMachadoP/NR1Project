import { NextResponse } from "next/server";
import { submitAnonymousResponse } from "@/lib/server/services/submission-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await submitAnonymousResponse(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit survey.";
    const status = message === "INVALID_OR_EXPIRED_TOKEN" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
