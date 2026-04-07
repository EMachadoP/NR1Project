import { NextResponse } from "next/server";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";
import { requirePortalApiSession } from "@/lib/auth/session";
import { isCampaignQuestionnaireStatusAllowed, toApiErrorResponse } from "@/lib/server/http/errors";
import { createCampaign } from "@/lib/server/repositories/campaigns-repository";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export async function GET() {
  try {
    const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
    const items = await listCampaignsService(actor);
    return NextResponse.json({ items });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePortalApiSession(["admin"]);

    const body = await request.json();
    const { name, questionnaire_id, start_date, end_date, sector, unit } = body;

    if (!name || !questionnaire_id || !start_date || !end_date) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    if (new Date(end_date) <= new Date(start_date)) {
      throw new Error("INVALID_DATE_RANGE");
    }

    const supabase = createAdminSupabaseClient();
    const { data: questionnaire } = await supabase
      .from("questionnaires")
      .select("id, status")
      .eq("id", questionnaire_id)
      .maybeSingle();

    if (!questionnaire) {
      throw new Error("QUESTIONNAIRE_NOT_FOUND");
    }

    if (!isCampaignQuestionnaireStatusAllowed(questionnaire.status)) {
      throw new Error("QUESTIONNAIRE_NOT_PUBLISHED");
    }

    try {
      const campaign = await createCampaign({ name, questionnaire_id, start_date, end_date, sector, unit });
      return NextResponse.json({ success: true, campaign }, { status: 201 });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : "";
      if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
        throw new Error("DUPLICATE_CAMPAIGN_NAME");
      }
      throw dbError;
    }
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

