import { NextResponse } from "next/server";
import { submitAnonymousResponse } from "@/lib/server/services/submission-service";
import { getPublicSubmissionErrorStatus } from "@/lib/server/http/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await submitAnonymousResponse(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("public_submission_failed", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "Failed to submit survey.";
    const status = getPublicSubmissionErrorStatus(message);
    return NextResponse.json({ error: message }, { status });
  }
}
