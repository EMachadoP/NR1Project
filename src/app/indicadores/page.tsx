import { IndicatorsManager } from "@/components/portal/indicators-manager";
import { EmptyPortalState } from "@/components/portal/empty-portal-state";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";
import { listIndicatorsService } from "@/lib/server/services/indicator-service";

export default async function IndicatorsPage({ searchParams }: { searchParams: Promise<{ campaignId?: string }> }) {
  const session = await requirePortalSession();
  const params = await searchParams;
  const campaigns = await listCampaignsService(session);
  const selectedCampaignId = params.campaignId ?? campaigns[0]?.id;
  const indicators = selectedCampaignId ? await listIndicatorsService(session, selectedCampaignId) : [];

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const actionNeededCount = indicators.filter((i) => i.action_needed).length;

  return (
    <PortalShell
      session={session}
      eyebrow="Monitoramento"
      title="Indicadores"
      description="Acompanhe variações por período e identifique necessidade de intervenção."
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Indicadores"
          title="Nenhuma campanha disponível"
          description="Este módulo requer ao menos uma campanha acessível. Carregue campanhas para iniciar o acompanhamento."
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
                href={`/indicadores?campaignId=${campaign.id}`}
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

          {selectedCampaign && indicators.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>{indicators.length} indicador{indicators.length !== 1 ? "es" : ""}</span>
              {actionNeededCount > 0 && (
                <span className="flex items-center gap-1.5 text-danger font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {actionNeededCount} requer{actionNeededCount !== 1 ? "em" : ""} ação
                </span>
              )}
            </div>
          )}

          {selectedCampaignId ? <IndicatorsManager campaignId={selectedCampaignId} items={indicators} /> : null}
        </>
      )}
    </PortalShell>
  );
}
