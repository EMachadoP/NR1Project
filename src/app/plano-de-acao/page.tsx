import { ActionPlansManager } from "@/components/portal/action-plans-manager";
import { EmptyPortalState } from "@/components/portal/empty-portal-state";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { listActionPlansService } from "@/lib/server/services/action-plan-service";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";

export default async function ActionPlanPage({ searchParams }: { searchParams: Promise<{ campaignId?: string }> }) {
  const session = await requirePortalSession();
  const params = await searchParams;
  const campaigns = await listCampaignsService(session);
  const selectedCampaignId = params.campaignId ?? campaigns[0]?.id;
  const plans = selectedCampaignId ? await listActionPlansService(session, selectedCampaignId) : [];

  return (
    <PortalShell
      session={session}
      title="Plano de acao"
      description="CRUD operacional com historico e audit log obrigatorios para cada alteracao relevante."
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Plano de acao"
          title="Nenhuma campanha para operar"
          description="O modulo de plano de acao depende de pelo menos uma campanha ativa ou agendada. Cadastre ou carregue campanhas para iniciar o acompanhamento."
          actionHref="/campanhas"
          actionLabel="Voltar para campanhas"
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            {campaigns.map((campaign) => (
              <a key={campaign.id} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCampaignId === campaign.id ? "bg-accent text-white" : "bg-white text-slate-700"}`} href={`/plano-de-acao?campaignId=${campaign.id}`}>
                {campaign.name}
              </a>
            ))}
          </div>
          {selectedCampaignId ? <ActionPlansManager campaignId={selectedCampaignId} items={plans} /> : null}
        </>
      )}
    </PortalShell>
  );
}
