import { IndicatorsManager } from "@/components/portal/indicators-manager";
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

  return (
    <PortalShell
      session={session}
      title="Indicadores"
      description="Acompanhamento por periodo com variacao e sinalizacao de necessidade de acao."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {campaigns.map((campaign) => (
          <a key={campaign.id} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCampaignId === campaign.id ? "bg-accent text-white" : "bg-white text-slate-700"}`} href={`/indicadores?campaignId=${campaign.id}`}>
            {campaign.name}
          </a>
        ))}
      </div>
      {selectedCampaignId ? <IndicatorsManager campaignId={selectedCampaignId} items={indicators} /> : null}
    </PortalShell>
  );
}
