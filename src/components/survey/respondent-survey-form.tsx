"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SurveyQuestion = {
  id: string;
  prompt: string;
  answerType: string;
  orderIndex: number;
  isRequired: boolean;
  hazardCode: number | null;
  sourceReference: string | null;
  severityScore: number | null;
  severityLabel: string | null;
  circumstancesText: string | null;
  outcomesText: string | null;
};

type SurveySection = {
  id: string;
  name: string;
  orderIndex: number;
  questions: SurveyQuestion[];
};

type RespondentSurveyFormProps = {
  token: string;
  sections: SurveySection[];
};

const scaleLabels = [
  { value: 1, label: "Nao ocorre" },
  { value: 2, label: "Baixo" },
  { value: 3, label: "Moderado" },
  { value: 4, label: "Alto" },
  { value: 5, label: "Critico" }
];

export function RespondentSurveyForm({ token, sections }: RespondentSurveyFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [observationText, setObservationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/public/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        observationText,
        answers: Object.entries(answers).map(([questionId, answerRaw]) => ({ questionId, answerRaw }))
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel enviar suas respostas.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/obrigado/${payload.receiptCode}`);
  }

  const allQuestions = sections.flatMap((section) => section.questions);
  const requiredQuestions = allQuestions.filter((question) => question.isRequired);
  const answeredQuestions = Object.keys(answers).length;
  const answeredRequiredQuestions = requiredQuestions.filter((question) => answers[question.id] != null).length;
  const totalRequiredQuestions = requiredQuestions.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-panel">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Questionario anonimo</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Mapeamento de Risco NR-1</h2>
          </div>
          <div className="rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            {answeredRequiredQuestions} / {totalRequiredQuestions}
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-gradient-to-r from-accent to-sky-700" style={{ width: `${(answeredRequiredQuestions / Math.max(totalRequiredQuestions, 1)) * 100}%` }} />
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Avalie cada perigo psicossocial conforme a presenca ou intensidade percebida no seu trabalho. Perguntas opcionais podem ser deixadas em branco e nao entram no calculo oficial da media da secao.
        </p>
        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-5">
          {scaleLabels.map((item) => (
            <div key={item.value} className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-lg font-semibold text-sky-950">{item.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.id} className="space-y-4 rounded-2xl bg-white p-6 shadow-panel">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Secao</p>
            <h3 className="mt-2 text-2xl font-semibold">{section.name}</h3>
          </header>

          {section.questions.map((question) => (
            <div key={question.id} className="rounded-2xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {question.hazardCode ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Perigo {question.hazardCode}</span> : null}
                    {question.sourceReference ? <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{question.sourceReference}</span> : null}
                    {question.severityLabel ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{question.severityLabel.split(" ")[0]}</span> : null}
                  </div>
                  <p className="text-lg font-medium text-ink">{question.prompt}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${question.isRequired ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {question.isRequired ? "Obrigatoria" : "Opcional"}
                </span>
              </div>

              {question.circumstancesText || question.outcomesText ? (
                <details className="mt-4 rounded-2xl bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-sky-800">Contexto tecnico do perigo</summary>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                    {question.circumstancesText ? (
                      <div>
                        <p className="font-semibold text-slate-800">Fontes e circunstancias</p>
                        <p>{question.circumstancesText}</p>
                      </div>
                    ) : null}
                    {question.outcomesText ? (
                      <div>
                        <p className="font-semibold text-slate-800">Possiveis agravos</p>
                        <p>{question.outcomesText}</p>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}

              <div className="mt-4 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = answers[question.id] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))}
                      className={`rounded-xl px-0 py-3 text-sm font-bold transition ${selected ? "bg-accent text-white" : "bg-white text-slate-700"}`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <section className="rounded-2xl bg-white p-6 shadow-panel">
        <label className="block text-sm font-semibold text-ink" htmlFor="observations">
          Observacoes opcionais
        </label>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Nao inclua nome, CPF, telefone, matricula ou qualquer dado pessoal. Este campo e tratado como nota anonima e pode sofrer redacao automatica no backend.
        </p>
        <textarea
          id="observations"
          className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-accent"
          value={observationText}
          onChange={(event) => setObservationText(event.target.value)}
        />
      </section>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">{answeredQuestions} respostas preenchidas no total.</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || answeredRequiredQuestions !== totalRequiredQuestions}
          className="rounded-xl bg-gradient-to-r from-accent to-sky-700 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Enviar respostas"}
        </button>
      </div>
    </div>
  );
}
