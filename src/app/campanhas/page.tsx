import Link from "next/link";
import { EmptyPortalState } from "@/components/portal/empty-portal-state";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  scheduled: { label: "Agendada", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  closed: { label: "Encerrada", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  draft: { label: "Rascunho", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" }
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CampaignsPage() {
  const session = await requirePortalSession();
  const campaigns = await listCampaignsService(session);

  const newCampaignButton = session.role === "admin" ? (
    <Link
      href="/campanhas/new"
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Nova Campanha
    </Link>
  ) : null;

  return (
    <PortalShell
      session={session}
      eyebrow="Gestão"
      title="Campanhas"
      description="Acompanhe adesão, risco consolidado e módulos operacionais por campanha."
      action={newCampaignButton}
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Campanhas"
          title="Nenhuma campanha encontrada"
          description="Não existem campanhas cadastradas no ambiente. Crie a primeira campanha para iniciar o fluxo de coleta anônima."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campanhas/${campaign.id}`}
              className="group flex flex-col rounded-xl border border-line bg-white p-5 shadow-card transition-all hover:border-accent/30 hover:shadow-card-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-light">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <StatusBadge status={campaign.status} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-ink group-hover:text-accent transition-colors">
                {campaign.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                {campaign.sector && <span>{campaign.sector}</span>}
                {campaign.sector && campaign.unit && <span>·</span>}
                {campaign.unit && <span>{campaign.unit}</span>}
              </div>

              <div className="mt-auto pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
                <span>{formatDate(campaign.start_date)}</span>
                <span>até {formatDate(campaign.end_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
