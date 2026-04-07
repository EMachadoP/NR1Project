import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { getCampaignDashboardService } from "@/lib/server/services/dashboard-service";

type RiskLevel = "MUITO BAIXO" | "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";

function getRiskConfig(label: string): { color: string; bar: string; badge: string } {
  const level = label?.toUpperCase() as RiskLevel;
  const map: Record<RiskLevel, { color: string; bar: string; badge: string }> = {
    "MUITO BAIXO": { color: "text-emerald-700", bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    "BAIXO":       { color: "text-teal-700",    bar: "bg-teal-500",    badge: "bg-teal-50 text-teal-700 ring-teal-200" },
    "MÉDIO":       { color: "text-amber-700",   bar: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 ring-amber-200" },
    "ALTO":        { color: "text-orange-700",  bar: "bg-orange-500",  badge: "bg-orange-50 text-orange-700 ring-orange-200" },
    "CRÍTICO":     { color: "text-red-700",     bar: "bg-red-500",     badge: "bg-red-50 text-red-700 ring-red-200" }
  };
  return map[level] ?? { color: "text-slate-700", bar: "bg-slate-400", badge: "bg-slate-100 text-slate-600 ring-slate-200" };
}

function riskBarWidth(average: number): string {
  // Scale 1–5 → 0–100%
  const pct = Math.max(0, Math.min(100, ((average - 1) / 4) * 100));
  return `${pct.toFixed(1)}%`;
}

export default async function CampaignDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePortalSession();
  const { id } = await params;

  try {
    const dashboard = await getCampaignDashboardService(id, session);

    if (dashboard.summary.anonymity.blocked) {
      return (
        <PortalShell
          session={session}
          eyebrow="Dashboard da campanha"
          title={dashboard.campaign.name}
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Anonimato preservado</p>
                <p className="mt-1 text-sm text-amber-800">{dashboard.summary.anonymity.reason}</p>
                <p className="mt-2 text-xs text-amber-700">
                  Mínimo configurado: {dashboard.summary.anonymity.minimumGroupSize} respostas necessárias para exibição.
                </p>
              </div>
            </div>
          </div>
        </PortalShell>
      );
    }

    const criticalSections = dashboard.summary.sectionSummaries.filter((s) => s.criticalItemCount > 0);

    return (
      <PortalShell
        session={session}
        eyebrow="Dashboard da campanha"
        title={dashboard.campaign.name}
        description="Painel consolidado de risco. O cálculo oficial é centralizado no backend."
      >
        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Respostas</p>
            <p className="mt-2 text-3xl font-bold text-ink">{dashboard.summary.responseCount}</p>
            <p className="mt-1 text-xs text-muted">Total coletado</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Itens críticos</p>
            <p className={`mt-2 text-3xl font-bold ${dashboard.summary.criticalItems.length > 0 ? "text-danger" : "text-emerald-600"}`}>
              {dashboard.summary.criticalItems.length}
            </p>
            <p className="mt-1 text-xs text-muted">Risco ≥ 4 por item</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Seções avaliadas</p>
            <p className="mt-2 text-3xl font-bold text-ink">{dashboard.summary.sectionSummaries.length}</p>
            <p className="mt-1 text-xs text-muted">Blocos temáticos</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Risk by section */}
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-ink">Risco por seção</h2>
              <Link
                href={`/plano-de-acao?campaignId=${dashboard.campaign.id}`}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Ver plano de ação →
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.summary.sectionSummaries.map((section) => {
                const config = getRiskConfig(section.label);
                return (
                  <div key={section.sectionId} className="rounded-lg border border-line p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{section.label}</p>
                        <p className="mt-0.5 text-xs text-muted">{section.sectionId}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {section.criticalItemCount > 0 && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-danger ring-1 ring-red-200">
                            {section.criticalItemCount} crítico{section.criticalItemCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className={`text-2xl font-bold ${config.color}`}>{section.average}</span>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${config.bar}`}
                        style={{ width: riskBarWidth(section.average) }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${config.color}`}>{section.label}</span>
                      <span className="text-xs text-muted">escala 1–5</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick actions */}
            <section className="rounded-xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-ink">Ações rápidas</h2>
              <div className="mt-4 space-y-2">
                <Link
                  href={`/plano-de-acao?campaignId=${dashboard.campaign.id}`}
                  className="flex items-center justify-between rounded-lg border border-line p-3 text-sm font-medium text-ink transition hover:border-accent/40 hover:bg-accent-light"
                >
                  <span>Plano de ação</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link
                  href={`/indicadores?campaignId=${dashboard.campaign.id}`}
                  className="flex items-center justify-between rounded-lg border border-line p-3 text-sm font-medium text-ink transition hover:border-accent/40 hover:bg-accent-light"
                >
                  <span>Indicadores</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </section>

            {/* Critical items */}
            {criticalSections.length > 0 && (
              <section className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-danger" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h2 className="text-sm font-semibold text-danger">Seções com itens críticos</h2>
                </div>
                <ul className="mt-3 space-y-2">
                  {criticalSections.map((s) => (
                    <li key={s.sectionId} className="flex items-center justify-between text-sm">
                      <span className="text-red-800">{s.label}</span>
                      <span className="font-semibold text-danger">{s.criticalItemCount}x</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Scale legend */}
            <section className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Escala de risco</p>
              <div className="mt-3 space-y-2">
                {[
                  { range: "1,0 – 1,5", label: "Muito baixo", color: "bg-emerald-500" },
                  { range: "1,6 – 2,5", label: "Baixo", color: "bg-teal-500" },
                  { range: "2,6 – 3,5", label: "Médio", color: "bg-amber-500" },
                  { range: "3,6 – 4,5", label: "Alto", color: "bg-orange-500" },
                  { range: "4,6 – 5,0", label: "Crítico", color: "bg-red-500" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted">{item.range}</span>
                    <span className="ml-auto text-xs font-medium text-ink">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </PortalShell>
    );
  } catch {
    return (
      <PortalShell session={session} eyebrow="Campanha" title="Campanha não encontrada">
        <div className="rounded-xl border border-line bg-white p-6 shadow-card">
          <p className="text-sm text-muted">Esta campanha não foi encontrada ou está fora do seu escopo de acesso.</p>
        </div>
      </PortalShell>
    );
  }
}
