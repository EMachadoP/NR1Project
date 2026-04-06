import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { getCampaignDashboardService } from "@/lib/server/services/dashboard-service";

export default async function CampaignDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePortalSession();
  const { id } = await params;

  try {
    const dashboard = await getCampaignDashboardService(id, session);

    if (dashboard.summary.anonymity.blocked) {
      return (
        <PortalShell
          session={session}
          title={dashboard.campaign.name}
          description="Painel consolidado de risco da campanha. O calculo oficial permanece centralizado no backend."
        >
          <div className="rounded-2xl bg-white p-8 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Anonimato preservado</p>
            <h3 className="mt-3 text-2xl font-semibold text-sky-950">Exibicao consolidada temporariamente bloqueada</h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{dashboard.summary.anonymity.reason}</p>
            <p className="mt-3 text-sm text-slate-500">Limiar minimo configurado no backend: {dashboard.summary.anonymity.minimumGroupSize} respostas.</p>
          </div>
        </PortalShell>
      );
    }

    return (
      <PortalShell
        session={session}
        title={dashboard.campaign.name}
        description="Painel consolidado de risco da campanha. O calculo oficial permanece centralizado no backend."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Respostas</p>
            <p className="mt-3 text-4xl font-semibold text-sky-950">{dashboard.summary.responseCount}</p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Itens criticos</p>
            <p className="mt-3 text-4xl font-semibold text-red-700">{dashboard.summary.criticalItems.length}</p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Secoes avaliadas</p>
            <p className="mt-3 text-4xl font-semibold text-sky-950">{dashboard.summary.sectionSummaries.length}</p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-sky-950">Risco por secao</h3>
              <Link href={`/plano-de-acao?campaignId=${dashboard.campaign.id}`} className="text-sm font-semibold text-accent">Plano de acao</Link>
            </div>
            <div className="mt-5 space-y-4">
              {dashboard.summary.sectionSummaries.map((section) => (
                <article key={section.sectionId} className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{section.sectionId}</p>
                      <p className="mt-2 text-xl font-semibold text-sky-950">{section.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold text-sky-950">{section.average}</p>
                      <p className="mt-1 text-sm text-slate-500">{section.criticalItemCount} itens criticos</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-panel">
            <h3 className="text-2xl font-semibold text-sky-950">Acessos rapidos</h3>
            <div className="mt-5 space-y-3">
              <Link href={`/plano-de-acao?campaignId=${dashboard.campaign.id}`} className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800">Gerenciar plano de acao</Link>
              <Link href={`/indicadores?campaignId=${dashboard.campaign.id}`} className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800">Gerenciar indicadores</Link>
            </div>
          </aside>
        </div>
      </PortalShell>
    );
  } catch {
    return (
      <PortalShell session={session} title="Campanha" description="Campanha nao encontrada ou fora do escopo de acesso.">
        <div className="rounded-2xl bg-white p-6 shadow-panel">Campanha nao encontrada ou fora do escopo de acesso.</div>
      </PortalShell>
    );
  }
}
