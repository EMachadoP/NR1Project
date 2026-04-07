import type { Route } from "next";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { listQuestionnaires } from "@/lib/server/repositories/questionnaire-repository";
import { QuickPublishButton, QuickDeleteButton } from "./list-actions";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  published: { label: "Publicado", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  archived: { label: "Arquivado", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" }
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminQuestionnairesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requirePortalSession(["admin"]);
  const { status } = await searchParams;
  const questionnaires = await listQuestionnaires(status);

  const newButton = (
    <Link
      href={"/admin/questionarios/new" as Route}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Novo Questionário
    </Link>
  );

  return (
    <PortalShell
      session={session}
      eyebrow="Administração"
      title="Questionários"
      description="Crie e gerencie questionários de avaliação psicossocial."
      action={newButton}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "Todos", value: "" },
          { label: "Rascunho", value: "draft" },
          { label: "Publicado", value: "published" },
          { label: "Arquivado", value: "archived" }
        ].map(({ label, value }) => (
          <Link
            key={value}
            href={(value ? `/admin/questionarios?status=${value}` : "/admin/questionarios") as Route}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${(status ?? "") === value ? "border-accent bg-accent text-white" : "border-line text-ink hover:border-accent/40 hover:bg-accent-light"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {questionnaires.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-ink">Nenhum questionário encontrado</p>
          <p className="mt-1 text-sm text-muted">Crie o primeiro questionário para começar.</p>
          <Link href={"/admin/questionarios/new" as Route} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            Criar questionário →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-muted">Nome</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-muted">Versão</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-muted">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-muted">Criado em</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-muted">Publicado em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {questionnaires.map((q) => (
                <tr key={q.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-ink">{q.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">{q.version}</td>
                  <td className="px-5 py-4"><StatusBadge status={q.status} /></td>
                  <td className="px-5 py-4 text-muted">{formatDate(q.created_at)}</td>
                  <td className="px-5 py-4 text-muted">{formatDate(q.published_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {q.status === "draft" && (
                        <Link
                          href={`/admin/questionarios/${q.id}/edit` as Route}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/40 hover:bg-accent-light"
                        >
                          Editar
                        </Link>
                      )}
                      {q.status === "draft" && <QuickPublishButton questionnaireId={q.id} />}
                      {q.status !== "published" && <QuickDeleteButton questionnaireId={q.id} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
