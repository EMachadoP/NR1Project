"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewQuestionnairePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("v1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), version: version.trim() || "v1" })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error === "FORBIDDEN" ? "Sem permissão." : "Erro ao criar questionário.");
        return;
      }

      const { questionnaire } = await res.json();
      router.push(`/admin/questionarios/${questionnaire.id}/edit` as Route);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Link href={"/admin/questionarios" as Route} className="text-xs font-medium text-muted hover:text-ink">
            ← Questionários
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Novo Questionário</h1>
          <p className="mt-1 text-sm text-muted">Defina o nome e a versão. Você adicionará seções e perguntas no editor.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="space-y-5 p-6">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                  Nome <span className="text-danger">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ex.: Avaliação de Riscos Psicossociais NR-1"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${error && !name.trim() ? "border-danger" : "border-line"}`}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="version" className="mb-1.5 block text-sm font-medium text-ink">Versão</label>
                <input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <Link href={"/admin/questionarios" as Route} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
              >
                {submitting && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                )}
                {submitting ? "Criando…" : "Criar e Editar →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
