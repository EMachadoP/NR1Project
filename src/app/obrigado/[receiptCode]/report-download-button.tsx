"use client";

import { useState } from "react";

export function ReportDownloadButton({ receiptCode }: { receiptCode: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/receipts/${receiptCode}/report`);

      if (res.status === 401 || res.status === 403) {
        setError("Comprovante inválido, expirado ou sem permissão para este relatório.");
        return;
      }

      if (!res.ok) {
        setError("Relatório indisponível no momento.");
        return;
      }

      const { signedUrl } = await res.json();

      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = `relatorio-${receiptCode}.html`;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent-light px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Preparando download…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Relatório Individual
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
