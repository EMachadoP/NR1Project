import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export default async function QuestionnairesPage() {
  const session = await requirePortalSession(["admin", "hr"]);
  const supabase = createAdminSupabaseClient();

  const { data: questionnaires } = await supabase
    .from("questionnaires")
    .select("id, name, version, status, questionnaire_sections(id, name, order_index, questionnaire_questions(id, source_reference))")
    .order("published_at", { ascending: false });

  const current = questionnaires?.[0] ?? null;

  const sectionSummaries = (current?.questionnaire_sections ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((section) => ({
      id: section.id,
      name: section.name,
      questionCount: section.questionnaire_questions?.length ?? 0,
      sources: [...new Set((section.questionnaire_questions ?? []).map((q) => q.source_reference).filter(Boolean))]
    }));

  const totalQuestions = sectionSummaries.reduce((sum, s) => sum + s.questionCount, 0);
  const sourceSet = new Set(
    (current?.questionnaire_sections ?? []).flatMap((s) =>
      (s.questionnaire_questions ?? []).map((q) => q.source_reference).filter(Boolean)
    )
  );

  return (
    <PortalShell
      session={session}
      eyebrow="Configuração"
      title="Questionários"
      description="Catálogo técnico publicado com blocos temáticos, origem metodológica e volume de perguntas."
    >
      {current ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Questionário ativo</p>
              <p className="mt-2 text-base font-semibold text-ink truncate">{current.name}</p>
              <p className="mt-1 text-xs text-muted">Versão {current.version} · {current.status}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Seções</p>
              <p className="mt-2 text-3xl font-bold text-ink">{sectionSummaries.length}</p>
              <p className="mt-1 text-xs text-muted">Blocos temáticos</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Perguntas</p>
              <p className="mt-2 text-3xl font-bold text-ink">{totalQuestions}</p>
              <p className="mt-1 text-xs text-muted truncate">Fontes: {[...sourceSet].join(" · ") || "Catálogo interno"}</p>
            </div>
          </div>

          {/* Section grid */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Blocos temáticos</h2>
            <div className="grid gap-3 xl:grid-cols-2">
              {sectionSummaries.map((section, index) => (
                <article key={section.id} className="flex gap-4 rounded-xl border border-line bg-white p-5 shadow-card">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-sm font-bold text-accent">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-ink truncate">{section.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {section.questionCount} perigo{section.questionCount !== 1 ? "s" : ""} avaliado{section.questionCount !== 1 ? "s" : ""}
                      </span>
                      {section.sources.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {section.sources.map((src) => (
                            <span key={src as string} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                              {src as string}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-ink">Nenhum questionário publicado</p>
          <p className="mt-1.5 text-sm text-muted">Publique um questionário para que ele apareça aqui.</p>
        </div>
      )}
    </PortalShell>
  );
}
