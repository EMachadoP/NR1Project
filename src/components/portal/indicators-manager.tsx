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

export function IndicatorsManager({ items, campaignId }: IndicatorsManagerProps) {
  const [indicators, setIndicators] = useState(items);
  const [form, setForm] = useState({ periodLabel: "", indicatorName: "", previousValue: "", currentValue: "", targetValue: "" });

  async function createItem() {
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
  }

  async function removeItem(id: string) {
    const response = await fetch(`/api/admin/indicators/${id}`, { method: "DELETE" });
    if (response.ok) {
      setIndicators((current) => current.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {indicators.map((indicator) => (
          <article key={indicator.id} className="rounded-2xl bg-white p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{indicator.period_label}</p>
                <h3 className="mt-2 text-xl font-semibold text-sky-950">{indicator.indicator_name}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${indicator.action_needed ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {indicator.action_needed ? "Acao" : "Ok"}
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Anterior</p>
                <p className="mt-2 text-2xl font-semibold">{indicator.previous_value ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Atual</p>
                <p className="mt-2 text-2xl font-semibold">{indicator.current_value}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Variacao</p>
                <p className="mt-2 text-2xl font-semibold">{indicator.variation ?? "-"}</p>
              </div>
            </div>
            <button className="mt-5 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" onClick={() => removeItem(indicator.id)} type="button">Excluir</button>
          </article>
        ))}
      </div>

      <aside className="rounded-2xl bg-white p-6 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Novo indicador</p>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Periodo" value={form.periodLabel} onChange={(e) => setForm((current) => ({ ...current, periodLabel: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Indicador" value={form.indicatorName} onChange={(e) => setForm((current) => ({ ...current, indicatorName: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Valor anterior" value={form.previousValue} onChange={(e) => setForm((current) => ({ ...current, previousValue: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Valor atual" value={form.currentValue} onChange={(e) => setForm((current) => ({ ...current, currentValue: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Meta" value={form.targetValue} onChange={(e) => setForm((current) => ({ ...current, targetValue: e.target.value }))} />
          <button className="w-full rounded-xl bg-gradient-to-r from-accent to-sky-700 px-4 py-3 text-sm font-semibold text-white" onClick={createItem} type="button">Criar indicador</button>
        </div>
      </aside>
    </div>
  );
}
