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
      sources: [...new Set((section.questionnaire_questions ?? []).map((question) => question.source_reference).filter(Boolean))]
    }));

  const totalQuestions = sectionSummaries.reduce((sum, section) => sum + section.questionCount, 0);
  const sourceSet = new Set(
    (current?.questionnaire_sections ?? []).flatMap((section) =>
      (section.questionnaire_questions ?? []).map((question) => question.source_reference).filter(Boolean)
    )
  );

  return (
    <PortalShell
      session={session}
      title="Questionarios"
      description="Catalogo tecnico publicado no ambiente com blocos tematicos, origem metodologica e volume real de perguntas para o diagnostico psicossocial."
    >
      {current ? (
        <div className="space-y-6">
          <section className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-6 shadow-panel">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Questionario ativo</p>
              <h3 className="mt-3 text-2xl font-semibold text-sky-950">{current.name}</h3>
              <p className="mt-2 text-sm text-slate-600">Versao {current.version} · {current.status}</p>
            </article>
            <article className="rounded-2xl bg-white p-6 shadow-panel">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Secoes</p>
              <p className="mt-3 text-4xl font-semibold text-sky-950">{sectionSummaries.length}</p>
            </article>
            <article className="rounded-2xl bg-white p-6 shadow-panel">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Perguntas</p>
              <p className="mt-3 text-4xl font-semibold text-sky-950">{totalQuestions}</p>
              <p className="mt-2 text-sm text-slate-600">Fontes: {[...sourceSet].join(" · ")}</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {sectionSummaries.map((section) => (
              <article key={section.id} className="rounded-2xl bg-white p-6 shadow-panel">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Bloco tematico</p>
                <h3 className="mt-3 text-xl font-semibold text-sky-950">{section.name}</h3>
                <p className="mt-3 text-sm text-slate-600">{section.questionCount} perigos avaliados</p>
                <p className="mt-2 text-sm text-slate-500">Origem metodologica: {section.sources.join(" · ") || "Catalogo interno"}</p>
              </article>
            ))}
          </section>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-8 shadow-panel">
          Nenhum questionario publicado no ambiente.
        </div>
      )}
    </PortalShell>
  );
}
