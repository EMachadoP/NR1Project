import { NextResponse } from "next/server";
import { getRespondentQuestionnaire } from "@/lib/server/services/submission-service";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const payload = await getRespondentQuestionnaire(token);

  if (!payload) {
    return NextResponse.json({ error: "Token invalido, expirado ou ja utilizado." }, { status: 403 });
  }

  return NextResponse.json({ item: payload });
}
