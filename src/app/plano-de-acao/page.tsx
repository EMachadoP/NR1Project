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

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <PortalShell
      session={session}
      eyebrow="Operacional"
      title="Plano de ação"
      description="Gerencie ações corretivas com responsáveis, prazos e histórico auditável."
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Plano de ação"
          title="Nenhuma campanha disponível"
          description="O módulo depende de pelo menos uma campanha ativa. Crie ou carregue campanhas para iniciar o acompanhamento."
          actionHref="/campanhas"
          actionLabel="Ver campanhas"
        />
      ) : (
        <>
          {/* Campaign tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`/plano-de-acao?campaignId=${campaign.id}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCampaignId === campaign.id
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white text-muted ring-1 ring-line hover:ring-accent/40"
                }`}
              >
                {campaign.name}
              </a>
            ))}
          </div>

          {selectedCampaign && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{plans.length} ação{plans.length !== 1 ? "ões" : ""} para <strong className="text-ink">{selectedCampaign.name}</strong></span>
            </div>
          )}

          {selectedCampaignId ? <ActionPlansManager campaignId={selectedCampaignId} items={plans} /> : null}
        </>
      )}
    </PortalShell>
  );
}
