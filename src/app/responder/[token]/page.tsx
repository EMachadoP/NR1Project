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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 rounded-2xl bg-white px-6 py-5 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">{payload.campaign.name}</p>
        <h1 className="mt-2 text-3xl font-semibold text-sky-950">{payload.questionnaire.name}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">Fluxo anonimo por token. Nenhum identificador pessoal e persistido neste modo.</p>
      </div>
      <RespondentSurveyForm token={token} sections={payload.sections} />
    </main>
  );
}
