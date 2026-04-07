import { notFound } from "next/navigation";
import { RespondentSurveyForm } from "@/components/survey/respondent-survey-form";
import { getRespondentQuestionnaire } from "@/lib/server/services/submission-service";

export default async function RespondentSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getRespondentQuestionnaire(token);

  if (!payload) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-canvas">
      {/* PWA top bar */}
      <div className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-accent">NR-1</p>
              <p className="text-[11px] text-muted leading-tight truncate max-w-[180px]">{payload.campaign.name}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Anônimo
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5">
        <div className="mb-5 rounded-xl border border-line bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Questionário</p>
          <h1 className="mt-1.5 text-xl font-semibold text-ink">{payload.questionnaire.name}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Fluxo anônimo por token. Nenhum identificador pessoal é armazenado neste modo.
          </p>
        </div>
        <RespondentSurveyForm token={token} sections={payload.sections} />
      </div>
    </main>
  );
}
