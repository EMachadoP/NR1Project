import { NextResponse } from "next/server";

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
