"use client";

import { useState, useCallback } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionDraft = {
  _key: string;
  prompt: string;
  answer_type: string;
  scoring_direction: "" | "positive" | "negative";
  weight: number;
  is_required: boolean;
};

type SectionDraft = {
  _key: string;
  name: string;
  questions: QuestionDraft[];
};

type EditorState = {
  name: string;
  version: string;
  sections: SectionDraft[];
};

type Props = {
  questionnaireId: string;
  initial: EditorState;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let keyCounter = 0;
function nextKey() {
  return `k${++keyCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyQuestion(): QuestionDraft {
  return { _key: nextKey(), prompt: "", answer_type: "likert_1_5", scoring_direction: "positive", weight: 1, is_required: true };
}

function emptySection(): SectionDraft {
  return { _key: nextKey(), name: "", questions: [emptyQuestion()] };
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(state: EditorState): string | null {
  if (!state.name.trim()) return "O nome do questionário é obrigatório.";
  if (state.sections.length === 0) return "Adicione ao menos uma seção.";
  for (const s of state.sections) {
    if (!s.name.trim()) return "Todas as seções devem ter um nome.";
    if (s.questions.length === 0) return `A seção "${s.name}" deve ter ao menos uma pergunta.`;
    for (const q of s.questions) {
      if (!q.prompt.trim()) return `Todas as perguntas devem ter um enunciado.`;
      if (q.answer_type === "likert_1_5" && !q.scoring_direction) {
        return `A pergunta "${q.prompt.slice(0, 30)}…" precisa de uma direção de pontuação.`;
      }
    }
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionRow({
  q, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast
}: {
  q: QuestionDraft;
  onChange: (updated: QuestionDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  function set<K extends keyof QuestionDraft>(k: K, v: QuestionDraft[K]) {
    onChange({ ...q, [k]: v });
  }

  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="rounded p-0.5 text-muted transition hover:bg-slate-200 disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="rounded p-0.5 text-muted transition hover:bg-slate-200 disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <textarea
            value={q.prompt}
            onChange={(e) => set("prompt", e.target.value)}
            placeholder="Enunciado da pergunta"
            rows={2}
            className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Tipo</label>
              <select
                value={q.answer_type}
                onChange={(e) => set("answer_type", e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
              >
                <option value="likert_1_5">Likert 1–5</option>
                <option value="text">Texto livre</option>
              </select>
            </div>
            {q.answer_type === "likert_1_5" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Direção</label>
                <select
                  value={q.scoring_direction}
                  onChange={(e) => set("scoring_direction", e.target.value as QuestionDraft["scoring_direction"])}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
                >
                  <option value="">Selecione…</option>
                  <option value="positive">Positiva (1=baixo risco)</option>
                  <option value="negative">Negativa (5=baixo risco)</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Peso</label>
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={q.weight}
                onChange={(e) => set("weight", parseFloat(e.target.value) || 1)}
                className="w-16 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.is_required}
                  onChange={(e) => set("is_required", e.target.checked)}
                  className="rounded border-line accent-accent"
                />
                Obrigatória
              </label>
            </div>
          </div>
        </div>

        <button type="button" onClick={onDelete} className="mt-1 shrink-0 rounded p-1 text-muted transition hover:bg-red-50 hover:text-danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuestionnaireEditor({ questionnaireId, initial }: Props) {
  const router = useRouter();
  const [state, setState] = useState<EditorState>(initial);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── State helpers ──────────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof EditorState>(k: K, v: EditorState[K]) => {
    setState((s) => ({ ...s, [k]: v }));
  }, []);

  function updateSection(sKey: string, updated: Partial<SectionDraft>) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) => sec._key === sKey ? { ...sec, ...updated } : sec)
    }));
  }

  function addSection() {
    setState((s) => ({ ...s, sections: [...s.sections, emptySection()] }));
  }

  function deleteSection(sKey: string) {
    setState((s) => ({ ...s, sections: s.sections.filter((sec) => sec._key !== sKey) }));
  }

  function moveSectionUp(idx: number) {
    if (idx === 0) return;
    setState((s) => ({ ...s, sections: swap(s.sections, idx, idx - 1) }));
  }

  function moveSectionDown(idx: number) {
    setState((s) => {
      if (idx >= s.sections.length - 1) return s;
      return { ...s, sections: swap(s.sections, idx, idx + 1) };
    });
  }

  function addQuestion(sKey: string) {
    updateSection(sKey, { questions: [...(state.sections.find((s) => s._key === sKey)?.questions ?? []), emptyQuestion()] });
  }

  function updateQuestion(sKey: string, qKey: string, updated: QuestionDraft) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec._key !== sKey ? sec : {
          ...sec,
          questions: sec.questions.map((q) => q._key === qKey ? updated : q)
        }
      )
    }));
  }

  function deleteQuestion(sKey: string, qKey: string) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec._key !== sKey ? sec : { ...sec, questions: sec.questions.filter((q) => q._key !== qKey) }
      )
    }));
  }

  function moveQuestionUp(sKey: string, qIdx: number) {
    if (qIdx === 0) return;
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec._key !== sKey ? sec : { ...sec, questions: swap(sec.questions, qIdx, qIdx - 1) }
      )
    }));
  }

  function moveQuestionDown(sKey: string, qIdx: number) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) => {
        if (sec._key !== sKey || qIdx >= sec.questions.length - 1) return sec;
        return { ...sec, questions: swap(sec.questions, qIdx, qIdx + 1) };
      })
    }));
  }

  // ── Save / Publish ──────────────────────────────────────────────────────────

  async function handleSave() {
    const validationError = validate(state);
    if (validationError) { setSaveError(validationError); return; }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaireId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          version: state.version,
          sections: state.sections.map((sec) => ({
            name: sec.name,
            questions: sec.questions.map((q) => ({
              prompt: q.prompt,
              answer_type: q.answer_type,
              scoring_direction: q.scoring_direction || null,
              weight: q.weight,
              is_required: q.is_required
            }))
          }))
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data?.error === "FORBIDDEN" ? "Sem permissão." : "Erro ao salvar. Tente novamente.");
        return;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const validationError = validate(state);
    if (validationError) { setSaveError(validationError); return; }

    // Save first, then publish
    setSaving(true);
    setSaveError(null);

    try {
      const saveRes = await fetch(`/api/admin/questionnaires/${questionnaireId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          version: state.version,
          sections: state.sections.map((sec) => ({
            name: sec.name,
            questions: sec.questions.map((q) => ({
              prompt: q.prompt,
              answer_type: q.answer_type,
              scoring_direction: q.scoring_direction || null,
              weight: q.weight,
              is_required: q.is_required
            }))
          }))
        })
      });

      if (!saveRes.ok) {
        setSaveError("Erro ao salvar antes de publicar.");
        return;
      }
    } finally {
      setSaving(false);
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaireId}/publish`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(
          data?.error === "QUESTIONNAIRE_EMPTY" ? "Adicione ao menos uma seção." :
          data?.error === "SECTION_EMPTY" ? "Cada seção deve ter ao menos uma pergunta." :
          "Erro ao publicar."
        );
        return;
      }
      router.push("/admin/questionarios" as Route);
      router.refresh();
    } catch {
      setSaveError("Erro de conexão ao publicar.");
    } finally {
      setPublishing(false);
    }
  }

  const busy = saving || publishing;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Nome <span className="text-danger">*</span>
              </label>
              <input
                value={state.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex.: Avaliação de Riscos Psicossociais NR-1"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Versão</label>
              <input
                value={state.version}
                onChange={(e) => setField("version", e.target.value)}
                placeholder="v1"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 pt-7">
          <button
            type="button"
            onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
            className="rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            {tab === "edit" ? "Preview" : "← Editar"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-60"
          >
            {saving ? "Salvando…" : saveSuccess ? "✓ Salvo" : "Salvar rascunho"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
          >
            {publishing && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {saveError}
        </div>
      )}

      {/* Tab content */}
      {tab === "edit" ? (
        <div className="space-y-4">
          {state.sections.map((sec, sIdx) => (
            <div key={sec._key} className="rounded-xl border border-line bg-white shadow-card">
              {/* Section header */}
              <div className="flex items-center gap-3 border-b border-line px-5 py-3">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveSectionUp(sIdx)} disabled={sIdx === 0} className="rounded p-0.5 text-muted transition hover:bg-slate-100 disabled:opacity-30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button type="button" onClick={() => moveSectionDown(sIdx)} disabled={sIdx === state.sections.length - 1} className="rounded p-0.5 text-muted transition hover:bg-slate-100 disabled:opacity-30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-light text-xs font-bold text-accent">
                  {sIdx + 1}
                </div>
                <input
                  value={sec.name}
                  onChange={(e) => updateSection(sec._key, { name: e.target.value })}
                  placeholder="Nome da seção"
                  className="flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
                />
                <span className="text-xs text-muted">{sec.questions.length} pergunta{sec.questions.length !== 1 ? "s" : ""}</span>
                <button
                  type="button"
                  onClick={() => deleteSection(sec._key)}
                  className="rounded p-1 text-muted transition hover:bg-red-50 hover:text-danger"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-3 p-5">
                {sec.questions.map((q, qIdx) => (
                  <QuestionRow
                    key={q._key}
                    q={q}
                    onChange={(updated) => updateQuestion(sec._key, q._key, updated)}
                    onDelete={() => deleteQuestion(sec._key, q._key)}
                    onMoveUp={() => moveQuestionUp(sec._key, qIdx)}
                    onMoveDown={() => moveQuestionDown(sec._key, qIdx)}
                    isFirst={qIdx === 0}
                    isLast={qIdx === sec.questions.length - 1}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addQuestion(sec._key)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-2.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar pergunta
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-4 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adicionar seção
          </button>
        </div>
      ) : (
        /* Preview */
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-white p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">{state.name || "Sem nome"}</h2>
            <p className="mt-1 text-sm text-muted">Versão {state.version || "v1"} · {state.sections.length} seção{state.sections.length !== 1 ? "ões" : ""} · {state.sections.reduce((n, s) => n + s.questions.length, 0)} perguntas</p>
          </div>
          {state.sections.map((sec, sIdx) => (
            <div key={sec._key} className="rounded-xl border border-line bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light text-sm font-bold text-accent">{sIdx + 1}</div>
                <h3 className="text-base font-semibold text-ink">{sec.name || "Seção sem nome"}</h3>
              </div>
              <div className="space-y-4">
                {sec.questions.map((q, qIdx) => (
                  <div key={q._key} className="rounded-lg border border-line p-4">
                    <p className="text-sm font-medium text-ink">
                      {qIdx + 1}. {q.prompt || <span className="italic text-muted">Pergunta sem enunciado</span>}
                      {q.is_required && <span className="ml-1 text-danger">*</span>}
                    </p>
                    {q.answer_type === "likert_1_5" && (
                      <div className="mt-3 flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div key={n} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-slate-50 text-sm font-medium text-muted">{n}</div>
                        ))}
                      </div>
                    )}
                    {q.answer_type === "text" && (
                      <div className="mt-3 h-16 rounded-lg border border-line bg-slate-50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {state.sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
              Nenhuma seção adicionada ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}


