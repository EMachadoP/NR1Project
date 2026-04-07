import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { CampaignForm } from "./campaign-form";

export default async function NewCampaignPage() {
  const session = await requirePortalSession(["admin"]);
  const supabase = createAdminSupabaseClient();

  const { data: questionnaires } = await supabase
    .from("questionnaires")
    .select("id, name, version, status")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <PortalShell
      session={session}
      eyebrow="Campanhas"
      title="Nova Campanha"
      description="Preencha os dados abaixo para criar uma nova campanha de coleta."
    >
      <div className="mx-auto max-w-2xl">
        <CampaignForm questionnaires={questionnaires ?? []} />
      </div>
    </PortalShell>
  );
}
