"use client";

import { useState } from "react";

type Indicator = {
  id: string;
  campaign_id: string;
  period_label: string;
  indicator_name: string;
  previous_value: number | null;
  current_value: number;
  target_value: number | null;
  variation: number | null;
  action_needed: boolean;
};

type IndicatorsManagerProps = {
  items: Indicator[];
  campaignId: string;
};

function TrendIcon({ variation }: { variation: number | null }) {
  if (variation === null) return <span className="text-muted">—</span>;
  if (variation > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        +{variation}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-danger font-semibold">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
      {variation}
    </span>
  );
}

export function IndicatorsManager({ items, campaignId }: IndicatorsManagerProps) {
  const [indicators, setIndicators] = useState(items);
  const [form, setForm] = useState({ periodLabel: "", indicatorName: "", previousValue: "", currentValue: "", targetValue: "" });
  const [isCreating, setIsCreating] = useState(false);

  async function createItem() {
    setIsCreating(true);
    const response = await fetch("/api/admin/indicators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        periodLabel: form.periodLabel,
        indicatorName: form.indicatorName,
        previousValue: form.previousValue ? Number(form.previousValue) : null,
        currentValue: Number(form.currentValue),
        targetValue: form.targetValue ? Number(form.targetValue) : null
      })
    });
    const payload = await response.json();
    if (response.ok) {
      setIndicators((current) => [payload.item, ...current]);
      setForm({ periodLabel: "", indicatorName: "", previousValue: "", currentValue: "", targetValue: "" });
    }
    setIsCreating(false);
  }

  async function removeItem(id: string) {
    const response = await fetch(`/api/admin/indicators/${id}`, { method: "DELETE" });
    if (response.ok) {
      setIndicators((current) => current.filter((item) => item.id !== id));
    }
  }

  const inputClass = "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {/* List */}
      <div className="space-y-3">
        {indicators.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
            <p className="text-sm text-muted">Nenhum indicador registrado para esta campanha.</p>
          </div>
        )}
        {indicators.map((indicator) => (
          <article key={indicator.id} className="rounded-xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {indicator.period_label}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{indicator.indicator_name}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                indicator.action_needed
                  ? "bg-red-50 text-danger ring-red-200"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200"
              }`}>
                {indicator.action_needed ? "Ação necessária" : "OK"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">Anterior</p>
                <p className="mt-1.5 text-xl font-bold text-ink">{indicator.previous_value ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">Atual</p>
                <p className="mt-1.5 text-xl font-bold text-ink">{indicator.current_value}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">Variação</p>
                <div className="mt-1.5 text-xl">
                  <TrendIcon variation={indicator.variation} />
                </div>
              </div>
            </div>

            {indicator.target_value !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Progresso até a meta</span>
                  <span>Meta: {indicator.target_value}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-1.5 rounded-full ${indicator.action_needed ? "bg-danger" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, (indicator.current_value / indicator.target_value) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <button
                className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-red-50"
                onClick={() => removeItem(indicator.id)}
                type="button"
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Form */}
      <aside className="rounded-xl border border-line bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Novo indicador</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Período *</label>
            <input className={inputClass} placeholder="Ex: Jan/2026" value={form.periodLabel} onChange={(e) => setForm((c) => ({ ...c, periodLabel: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Indicador *</label>
            <input className={inputClass} placeholder="Ex: Taxa de absenteísmo" value={form.indicatorName} onChange={(e) => setForm((c) => ({ ...c, indicatorName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Valor anterior</label>
            <input className={inputClass} type="number" placeholder="0" value={form.previousValue} onChange={(e) => setForm((c) => ({ ...c, previousValue: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Valor atual *</label>
            <input className={inputClass} type="number" placeholder="0" value={form.currentValue} onChange={(e) => setForm((c) => ({ ...c, currentValue: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Meta</label>
            <input className={inputClass} type="number" placeholder="0" value={form.targetValue} onChange={(e) => setForm((c) => ({ ...c, targetValue: e.target.value }))} />
          </div>
          <button
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            onClick={createItem}
            disabled={isCreating || !form.periodLabel || !form.indicatorName || !form.currentValue}
            type="button"
          >
            {isCreating ? "Registrando..." : "Registrar indicador"}
          </button>
        </div>
      </aside>
    </div>
  );
}
