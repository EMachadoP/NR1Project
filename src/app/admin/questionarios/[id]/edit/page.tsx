import type { Route } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalSession } from "@/lib/auth/session";
import { getQuestionnaireWithSections } from "@/lib/server/repositories/questionnaire-repository";
import { QuestionnaireEditor } from "@/components/admin/questionnaire-editor";

let keyCounter = 0;
function nextKey() {
  return `s${++keyCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export default async function EditQuestionnairePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePortalSession(["admin"]);
  const { id } = await params;

  const questionnaire = await getQuestionnaireWithSections(id);
  if (!questionnaire) notFound();

  // Map DB data to editor state (attach _key for React)
  const initial = {
    name: questionnaire.name,
    version: questionnaire.version,
    sections: questionnaire.sections.map((sec) => ({
      _key: nextKey(),
      name: sec.name,
      questions: sec.questions.map((q) => ({
        _key: nextKey(),
        prompt: q.prompt,
        answer_type: q.answer_type,
        scoring_direction: (q.scoring_direction ?? "") as "" | "positive" | "negative",
        weight: Number(q.weight),
        is_required: q.is_required
      }))
    }))
  };

  const statusLabel = questionnaire.status === "published" ? "Publicado" : questionnaire.status === "archived" ? "Arquivado" : "Rascunho";
  const isEditable = questionnaire.status === "draft";

  return (
    <PortalShell
      session={session}
      eyebrow="Questionários"
      title={questionnaire.name}
      description={`Versão ${questionnaire.version} · ${statusLabel}`}
      action={
        <Link href={"/admin/questionarios" as Route} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50">
          ← Lista
        </Link>
      }
    >
      {!isEditable && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 shrink-0 text-amber-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-sm text-amber-800">
            Este questionário está <strong>{statusLabel.toLowerCase()}</strong> e não pode ser editado. Para fazer alterações, crie um novo questionário.
          </p>
        </div>
      )}
      {isEditable ? (
        <QuestionnaireEditor questionnaireId={id} initial={initial} />
      ) : (
        /* Read-only preview for published/archived */
        <div className="space-y-4">
          {questionnaire.sections.map((sec, sIdx) => (
            <div key={sec.id} className="rounded-xl border border-line bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light text-sm font-bold text-accent">{sIdx + 1}</div>
                <h3 className="text-base font-semibold text-ink">{sec.name}</h3>
                <span className="text-xs text-muted">{sec.questions.length} perguntas</span>
              </div>
              <div className="space-y-3">
                {sec.questions.map((q, qIdx) => (
                  <div key={q.id} className="rounded-lg border border-line p-4">
                    <p className="text-sm font-medium text-ink">{qIdx + 1}. {q.prompt}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5">{q.answer_type}</span>
                      {q.scoring_direction && <span className="rounded-md bg-slate-100 px-2 py-0.5">{q.scoring_direction}</span>}
                      <span className="rounded-md bg-slate-100 px-2 py-0.5">peso {q.weight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

