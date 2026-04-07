import Link from "next/link";
import { EmptyPortalState } from "@/components/portal/empty-portal-state";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { listCampaignsService } from "@/lib/server/services/dashboard-service";

export default async function CampaignsPage() {
  const session = await requirePortalSession();
  const campaigns = await listCampaignsService(session);

  return (
    <PortalShell
      session={session}
      title="Campanhas"
      description="Acompanhe adesao, risco consolidado e acesso aos modulos operacionais por campanha."
    >
      {campaigns.length === 0 ? (
        <EmptyPortalState
          eyebrow="Portal RH"
          title="Nenhuma campanha disponivel"
          description="O portal esta autenticado, mas ainda nao existem campanhas cadastradas no ambiente. Cadastre ou carregue as campanhas iniciais para liberar o fluxo operacional."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campanhas/${campaign.id}`} className="rounded-2xl bg-white p-6 shadow-panel transition hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{campaign.status}</p>
              <h3 className="mt-3 text-2xl font-semibold text-sky-950">{campaign.name}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{campaign.sector ?? "Setor nao informado"} · {campaign.unit ?? "Unidade nao informada"}</p>
              <p className="mt-4 text-sm text-slate-500">{campaign.start_date} ate {campaign.end_date}</p>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
