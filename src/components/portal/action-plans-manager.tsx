"use client";

import { useState } from "react";

type ActionPlan = {
  id: string;
  campaign_id: string;
  risk_identified: string;
  section_name: string | null;
  root_cause: string | null;
  measure: string;
  owner_name: string | null;
  due_date: string | null;
  status: string;
  origin: string;
};

type ActionPlansManagerProps = {
  items: ActionPlan[];
  campaignId: string;
};

export function ActionPlansManager({ items, campaignId }: ActionPlansManagerProps) {
  const [plans, setPlans] = useState(items);
  const [form, setForm] = useState({ riskIdentified: "", measure: "", sectionName: "", ownerName: "", dueDate: "" });

  async function createPlan() {
    const response = await fetch("/api/admin/action-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        riskIdentified: form.riskIdentified,
        measure: form.measure,
        sectionName: form.sectionName || null,
        ownerName: form.ownerName || null,
        dueDate: form.dueDate || null,
        origin: "manual",
        status: "open"
      })
    });

    const payload = await response.json();
    if (response.ok) {
      setPlans((current) => [payload.item, ...current]);
      setForm({ riskIdentified: "", measure: "", sectionName: "", ownerName: "", dueDate: "" });
    }
  }

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/action-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const payload = await response.json();
    if (response.ok) {
      setPlans((current) => current.map((item) => (item.id === id ? payload.item : item)));
    }
  }

  async function removePlan(id: string) {
    const response = await fetch(`/api/admin/action-plans/${id}`, { method: "DELETE" });
    if (response.ok) {
      setPlans((current) => current.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl bg-white p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{plan.section_name ?? "Campanha"}</p>
                <h3 className="mt-2 text-xl font-semibold text-sky-950">{plan.risk_identified}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{plan.measure}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">{plan.status}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => updateStatus(plan.id, "in_progress")} type="button">Em andamento</button>
              <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => updateStatus(plan.id, "done")} type="button">Concluir</button>
              <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" onClick={() => removePlan(plan.id)} type="button">Excluir</button>
            </div>
          </article>
        ))}
      </div>

      <aside className="rounded-2xl bg-white p-6 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Nova acao</p>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Risco identificado" value={form.riskIdentified} onChange={(e) => setForm((current) => ({ ...current, riskIdentified: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Secao" value={form.sectionName} onChange={(e) => setForm((current) => ({ ...current, sectionName: e.target.value }))} />
          <textarea className="min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Medida recomendada" value={form.measure} onChange={(e) => setForm((current) => ({ ...current, measure: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Responsavel" value={form.ownerName} onChange={(e) => setForm((current) => ({ ...current, ownerName: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" type="date" value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} />
          <button className="w-full rounded-xl bg-gradient-to-r from-accent to-sky-700 px-4 py-3 text-sm font-semibold text-white" onClick={createPlan} type="button">Criar acao</button>
        </div>
      </aside>
    </div>
  );
}
