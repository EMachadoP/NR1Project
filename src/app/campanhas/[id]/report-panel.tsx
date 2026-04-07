"use client";

import { useState } from "react";

type InitialReport = { id: string; status: string } | null;

export function ReportPanel({ campaignId, initialReport }: { campaignId: string; initialReport: InitialReport }) {
  const [report, setReport] = useState<InitialReport>(initialReport);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDone = report?.status === "done";

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/reports/${campaignId}`, { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error ?? "REQUEST_FAILED";
        setError(
          msg === "CAMPAIGN_NOT_FOUND" ? "Campanha não encontrada." :
          msg === "FORBIDDEN" ? "Sem permissão para gerar relatórios." :
          "Erro ao gerar relatório. Tente novamente."
        );
        return;
      }

      const data = await res.json();
      setReport(data.report);

      // Trigger download immediately after generation
      triggerDownload(data.signedUrl, data.report.id);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!report?.id) return;
    setDownloading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/reports/${report.id}/download`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error === "REPORT_NOT_FOUND" ? "Relatório não encontrado." : "Erro ao preparar download.");
        return;
      }

      const { signedUrl } = await res.json();
      triggerDownload(signedUrl, report.id);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  function triggerDownload(signedUrl: string, reportId: string) {
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = `relatorio-analitico-${reportId}.html`;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  }

  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Relatório Analítico</h2>
          <p className="mt-0.5 text-xs text-muted">Relatório consolidado de risco por seção com plano de ação.</p>
        </div>
        {isDone && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Gerado
          </span>
        )}
        {report && !isDone && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            {report.status === "failed" ? "Falhou" : "Pendente"}
          </span>
        )}
      </div>

      <div className="p-6">
        {isDone ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">Relatório disponível para download.</p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Preparando…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Relatório Analítico
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {report?.status === "failed"
                ? "A geração anterior falhou. Tente gerar novamente."
                : "Nenhum relatório analítico gerado para esta campanha."}
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-light px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Gerando relatório…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Gerar Relatório
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
