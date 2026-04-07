import { NextResponse } from "next/server";

export function getPublicSubmissionErrorStatus(message: string) {
  return message === "INVALID_OR_EXPIRED_TOKEN" ? 403 : 500;
}

export function isCampaignQuestionnaireStatusAllowed(status: string | null | undefined) {
  return status === "published";
}

export function toApiErrorResponse(error: unknown, fallbackMessage = "REQUEST_FAILED") {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message === "UNAUTHORIZED") {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (message === "NOT_FOUND" || message === "REPORT_NOT_FOUND") {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  return NextResponse.json({ error: message }, { status: 400 });
}
