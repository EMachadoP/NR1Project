"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Questionnaire = { id: string; name: string; version: string };

const errorMessages: Record<string, string> = {
  MISSING_REQUIRED_FIELDS: "Preencha todos os campos obrigatórios.",
  INVALID_DATE_RANGE: "A data de término deve ser posterior à data de início.",
  QUESTIONNAIRE_NOT_FOUND: "Questionário selecionado não foi encontrado.",
  QUESTIONNAIRE_NOT_PUBLISHED: "A campanha só pode usar questionários publicados.",
  DUPLICATE_CAMPAIGN_NAME: "Já existe uma campanha com este nome.",
  FORBIDDEN: "Você não tem permissão para criar campanhas.",
  UNAUTHORIZED: "Sessão expirada. Faça login novamente."
};

export function CampaignForm({ questionnaires }: { questionnaires: Questionnaire[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    name: "",
    questionnaire_id: questionnaires[0]?.id ?? "",
    start_date: "",
    end_date: "",
    sector: "",
    unit: ""
  });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});

  function validate() {
    const next: Partial<typeof fields> = {};
    if (!fields.name.trim()) next.name = "Nome é obrigatório.";
    if (!fields.questionnaire_id) next.questionnaire_id = "Selecione um questionário.";
    if (!fields.start_date) next.start_date = "Data de início é obrigatória.";
    if (!fields.end_date) next.end_date = "Data de término é obrigatória.";
    if (fields.start_date && fields.end_date && fields.end_date <= fields.start_date) {
      next.end_date = "A data de término deve ser posterior à data de início.";
    }
    return next;
  }

  function set(field: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });

      if (res.ok) {
        router.push("/campanhas");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      const errorKey = data?.error ?? "REQUEST_FAILED";
      setServerError(errorMessages[errorKey] ?? "Ocorreu um erro ao criar a campanha.");
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-xl border border-line bg-white shadow-card">
        <div className="p-6 space-y-5">

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
              Nome <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex.: NR-1 2025 – Unidade Centro"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent ${errors.name ? "border-danger" : "border-line"}`}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>

          {/* Questionnaire */}
          <div>
            <label htmlFor="questionnaire_id" className="block text-sm font-medium text-ink mb-1.5">
              Questionário <span className="text-danger">*</span>
            </label>
            {questionnaires.length === 0 ? (
              <p className="text-sm text-amber-700 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                Nenhum questionário publicado encontrado. Publique um questionário antes de criar uma campanha.
              </p>
            ) : (
              <select
                id="questionnaire_id"
                value={fields.questionnaire_id}
                onChange={(e) => set("questionnaire_id", e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white ${errors.questionnaire_id ? "border-danger" : "border-line"}`}
              >
                {questionnaires.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} (v{q.version})
                  </option>
                ))}
              </select>
            )}
            {errors.questionnaire_id && <p className="mt-1 text-xs text-danger">{errors.questionnaire_id}</p>}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-1.5">
                Data de início <span className="text-danger">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                value={fields.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent ${errors.start_date ? "border-danger" : "border-line"}`}
              />
              {errors.start_date && <p className="mt-1 text-xs text-danger">{errors.start_date}</p>}
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-ink mb-1.5">
                Data de término <span className="text-danger">*</span>
              </label>
              <input
                id="end_date"
                type="date"
                value={fields.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent ${errors.end_date ? "border-danger" : "border-line"}`}
              />
              {errors.end_date && <p className="mt-1 text-xs text-danger">{errors.end_date}</p>}
            </div>
          </div>

          {/* Sector / Unit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-ink mb-1.5">
                Setor
              </label>
              <input
                id="sector"
                type="text"
                value={fields.sector}
                onChange={(e) => set("sector", e.target.value)}
                placeholder="Ex.: Produção"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-ink mb-1.5">
                Unidade
              </label>
              <input
                id="unit"
                type="text"
                value={fields.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="Ex.: Filial Centro"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {serverError && (
          <div className="mx-6 mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 shrink-0 text-danger" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-danger">{serverError}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
          <Link
            href="/campanhas"
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || questionnaires.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {submitting ? "Criando…" : "Criar Campanha"}
          </button>
        </div>
      </div>
    </form>
  );
}

