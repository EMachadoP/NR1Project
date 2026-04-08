import { EmptyPortalState } from "@/components/portal/empty-portal-state";
import { PortalShell } from "@/components/portal/portal-shell";
import { RiskInventoryManager } from "@/components/portal/risk-inventory-manager";
import { requirePortalSession } from "@/lib/auth/session";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";
import { getRiskInventoryVersionDetailService, listRiskInventoryVersionsService } from "@/lib/server/services/risk-inventory-service";

type RiskClassification = "Baixo" | "Medio" | "Alto" | "Critico";

function selectVersionId(
  availableVersionIds: string[],
  preferredVersionId: string | undefined,
  preferredDraftId: string | undefined,
  preferredPublishedId: string | undefined
) {
  if (preferredVersionId && availableVersionIds.includes(preferredVersionId)) {
    return preferredVersionId;
  }

  if (preferredDraftId) {
    return preferredDraftId;
  }

  if (preferredPublishedId) {
    return preferredPublishedId;
  }

  return availableVersionIds[0] ?? null;
}

export default async function RiskInventoryPage({
  searchParams
}: {
  searchParams: Promise<{ campaignId?: string; versionId?: string; riskClassification?: RiskClassification }>;
}) {
  const session = await requirePortalSession();
  const params = await searchParams;
  const campaigns = await listCampaignsService(session);
  const selectedCampaignId = params.campaignId ?? campaigns[0]?.id;
  const versions = selectedCampaignId ? await listRiskInventoryVersionsService(session, { campaignId: selectedCampaignId }) : [];
  const selectedVersionId = selectVersionId(
    versions.map((version) => version.id),
    params.versionId,
    versions.find((version) => version.status === "draft")?.id,
    versions.find((version) => version.status === "published")?.id
  );
  const selectedVersion = selectedVersionId ? await getRiskInventoryVersionDetailService(session, selectedVersionId) : null;

  return (
    <PortalShell
      session={session}
      eyebrow="NR-01"
      title="Inventário de Riscos"
      description="Gerencie a matriz Probabilidade x Severidade, priorize NRO e mantenha o inventário operacional do PGR atualizado."
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Inventário"
          title="Nenhuma campanha disponível"
          description="Cadastre ao menos uma campanha acessível para começar a estruturar o inventário de riscos no portal."
          actionHref="/campanhas"
          actionLabel="Ver campanhas"
        />
      ) : (
        <RiskInventoryManager
          campaigns={campaigns}
          initialCampaignId={selectedCampaignId}
          initialVersionId={selectedVersionId ?? undefined}
          initialClassification={params.riskClassification ?? null}
          versions={versions}
          selectedVersion={selectedVersion}
          sessionRole={session.role}
        />
      )}
    </PortalShell>
  );
}
