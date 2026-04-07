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
  { value: 1, label: "Não ocorre", color: "bg-emerald-500 text-white border-emerald-500" },
  { value: 2, label: "Baixo",      color: "bg-teal-500 text-white border-teal-500" },
  { value: 3, label: "Moderado",   color: "bg-amber-500 text-white border-amber-500" },
  { value: 4, label: "Alto",       color: "bg-orange-500 text-white border-orange-500" },
  { value: 5, label: "Crítico",    color: "bg-red-600 text-white border-red-600" }
];

const scaleDefault = "border-line bg-white text-ink hover:border-slate-300 hover:bg-slate-50";

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
      setError(payload.error ?? "Não foi possível enviar suas respostas. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/obrigado/${payload.receiptCode}`);
  }

  const allQuestions = sections.flatMap((s) => s.questions);
  const requiredQuestions = allQuestions.filter((q) => q.isRequired);
  const answeredRequiredCount = requiredQuestions.filter((q) => answers[q.id] != null).length;
  const totalRequiredCount = requiredQuestions.length;
  const progressPct = totalRequiredCount > 0 ? (answeredRequiredCount / totalRequiredCount) * 100 : 0;
  const canSubmit = answeredRequiredCount === totalRequiredCount;

  return (
    <div className="space-y-5">
      {/* Sticky progress header */}
      <div className="sticky top-0 z-10 rounded-xl border border-line bg-white/95 p-4 shadow-card-md backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Questionário anônimo</p>
              <p className="text-sm font-semibold text-ink">Mapeamento de Risco NR-1</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-ink">{answeredRequiredCount}<span className="text-sm font-normal text-muted">/{totalRequiredCount}</span></p>
            <p className="text-xs text-muted">obrigatórias</p>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Scale legend */}
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Escala de avaliação</p>
        <div className="grid grid-cols-5 gap-2">
          {scaleLabels.map((item) => (
            <div key={item.value} className="text-center">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${item.color}`}>
                {item.value}
              </div>
              <p className="mt-1.5 text-[10px] font-semibold uppercase leading-tight text-muted">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Perguntas opcionais podem ser deixadas em branco. Não entram na média da seção se não respondidas.
        </p>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className="rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Seção {section.orderIndex}</p>
            <h3 className="mt-1 text-base font-semibold text-ink">{section.name}</h3>
          </div>

          <div className="divide-y divide-line">
            {section.questions.map((question) => {
              const selected = answers[question.id];
              return (
                <div key={question.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Tags */}
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {question.hazardCode && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Perigo {question.hazardCode}
                          </span>
                        )}
                        {question.sourceReference && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {question.sourceReference}
                          </span>
                        )}
                        {question.severityLabel && (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {question.severityLabel.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-6 text-ink">{question.prompt}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      question.isRequired
                        ? "bg-ink text-white ring-ink/20"
                        : "bg-slate-100 text-slate-500 ring-slate-200"
                    }`}>
                      {question.isRequired ? "Obrigatória" : "Opcional"}
                    </span>
                  </div>

                  {/* Technical context */}
                  {(question.circumstancesText || question.outcomesText) && (
                    <details className="mt-3 rounded-lg border border-line">
                      <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-accent">
                        Ver contexto técnico
                      </summary>
                      <div className="border-t border-line px-4 py-3 space-y-3 text-xs leading-5 text-muted">
                        {question.circumstancesText && (
                          <div>
                            <p className="font-semibold text-ink mb-1">Fontes e circunstâncias</p>
                            <p>{question.circumstancesText}</p>
                          </div>
                        )}
                        {question.outcomesText && (
                          <div>
                            <p className="font-semibold text-ink mb-1">Possíveis agravos</p>
                            <p>{question.outcomesText}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Answer buttons */}
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const isSelected = selected === value;
                      const colorClass = scaleLabels[value - 1].color;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))}
                          className={`rounded-lg border py-3 text-sm font-bold transition-all active:scale-95 ${
                            isSelected ? colorClass : scaleDefault
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected label feedback */}
                  {selected && (
                    <p className="mt-2 text-xs font-medium text-muted text-center">
                      {scaleLabels[selected - 1].label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Observation */}
      <section className="rounded-xl border border-line bg-white p-5 shadow-card">
        <label htmlFor="observations" className="block text-sm font-semibold text-ink">
          Observações (opcional)
        </label>
        <p className="mt-1.5 text-xs leading-5 text-muted">
          Não inclua nome, CPF, telefone, matrícula ou qualquer dado pessoal. Este campo é tratado como nota anônima.
        </p>
        <textarea
          id="observations"
          className="mt-3 min-h-24 w-full resize-none rounded-lg border border-line px-3.5 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Comentário anônimo sobre o ambiente de trabalho..."
          value={observationText}
          onChange={(e) => setObservationText(e.target.value)}
        />
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 shrink-0 text-danger" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-card">
        <p className="text-xs text-muted">
          {!canSubmit ? (
            <span className="text-amber-700">
              {totalRequiredCount - answeredRequiredCount} pergunta{totalRequiredCount - answeredRequiredCount !== 1 ? "s" : ""} obrigatória{totalRequiredCount - answeredRequiredCount !== 1 ? "s" : ""} sem resposta.
            </span>
          ) : (
            <span className="text-emerald-700 font-medium">Todas as obrigatórias respondidas.</span>
          )}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? "Enviando..." : "Enviar respostas"}
        </button>
      </div>
    </div>
  );
}
