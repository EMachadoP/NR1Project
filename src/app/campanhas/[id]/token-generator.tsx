"use client";

import { useState } from "react";
import Image from "next/image";

type GeneratedToken = { token: string; url: string; qrCode: string };

const PRESET_COUNTS = [1, 5, 10, 50, 100];

export function TokenGenerator({ campaignId }: { campaignId: string }) {
  const [count, setCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<GeneratedToken[]>([]);

  const effectiveCount = useCustom ? (parseInt(customCount) || 0) : count;

  async function handleGenerate() {
    if (effectiveCount < 1 || effectiveCount > 1000) {
      setError("Quantidade deve ser entre 1 e 1000.");
      return;
    }

    setLoading(true);
    setError(null);
    setTokens([]);

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: effectiveCount })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error ?? "REQUEST_FAILED";
        setError(
          msg === "INVALID_COUNT" ? "Quantidade inválida (1–1000)." :
          msg === "NOT_FOUND" ? "Campanha não encontrada." :
          "Erro ao gerar tokens. Tente novamente."
        );
        return;
      }

      const data = await res.json();
      setTokens(data.tokens ?? []);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    const text = tokens.map((t) => t.url).join("\n");
    navigator.clipboard.writeText(text);
  }

  function downloadCsv() {
    const header = "token,url";
    const rows = tokens.map((t) => `${t.token},${t.url}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokens-${campaignId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Geração de Tokens</h2>
          <p className="mt-0.5 text-xs text-muted">Gere links únicos e QR codes para distribuição anônima.</p>
        </div>
        {tokens.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-slate-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copiar URLs
            </button>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-slate-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar CSV
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Count picker */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">Quantidade:</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setCount(n); setUseCustom(false); setError(null); }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${!useCustom && count === n ? "border-accent bg-accent text-white" : "border-line text-ink hover:border-accent/40 hover:bg-accent-light"}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setUseCustom(true); setError(null); }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${useCustom ? "border-accent bg-accent text-white" : "border-line text-ink hover:border-accent/40 hover:bg-accent-light"}`}
            >
              Outro
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              min={1}
              max={1000}
              value={customCount}
              onChange={(e) => { setCustomCount(e.target.value); setError(null); }}
              placeholder="1–1000"
              className="w-24 rounded-lg border border-line px-3 py-1.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || effectiveCount < 1 || effectiveCount > 1000}
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {loading ? "Gerando…" : "Gerar Tokens"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Results */}
        {tokens.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-ink">{tokens.length} token{tokens.length !== 1 ? "s" : ""} gerado{tokens.length !== 1 ? "s" : ""} · expiram em 7 dias</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tokens.map(({ token, url, qrCode }) => (
                <div key={token} className="flex flex-col items-center rounded-lg border border-line p-4 text-center">
                  <Image
                    src={qrCode}
                    alt={`QR code para token ${token.slice(0, 8)}`}
                    width={160}
                    height={160}
                    className="rounded"
                    unoptimized
                  />
                  <p className="mt-2 w-full truncate font-mono text-[10px] text-muted">{token}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-xs text-accent hover:underline truncate w-full"
                  >
                    Abrir link
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
