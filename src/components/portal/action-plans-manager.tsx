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

const statusConfig: Record<string, { label: string; className: string }> = {
  open:        { label: "Aberta",       className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  in_progress: { label: "Em andamento", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  done:        { label: "Concluída",    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" }
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

export function ActionPlansManager({ items, campaignId }: ActionPlansManagerProps) {
  const [plans, setPlans] = useState(items);
  const [form, setForm] = useState({ riskIdentified: "", measure: "", sectionName: "", ownerName: "", dueDate: "" });
  const [isCreating, setIsCreating] = useState(false);

  async function createPlan() {
    setIsCreating(true);
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
    setIsCreating(false);
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

  const inputClass = "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {/* List */}
      <div className="space-y-3">
        {plans.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
            <p className="text-sm text-muted">Nenhuma ação cadastrada para esta campanha.</p>
          </div>
        )}
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {plan.section_name && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {plan.section_name}
                    </span>
                  )}
                  <StatusBadge status={plan.status} />
                </div>
                <h3 className="mt-2.5 text-sm font-semibold text-ink">{plan.risk_identified}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{plan.measure}</p>
                {(plan.owner_name || plan.due_date) && (
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                    {plan.owner_name && (
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        {plan.owner_name}
                      </span>
                    )}
                    {plan.due_date && (
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {new Date(plan.due_date).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {plan.status !== "in_progress" && plan.status !== "done" && (
                <button
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  onClick={() => updateStatus(plan.id, "in_progress")}
                  type="button"
                >
                  Em andamento
                </button>
              )}
              {plan.status !== "done" && (
                <button
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  onClick={() => updateStatus(plan.id, "done")}
                  type="button"
                >
                  Concluir
                </button>
              )}
              <button
                className="ml-auto rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-red-50"
                onClick={() => removePlan(plan.id)}
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Nova ação</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Risco identificado *</label>
            <input className={inputClass} placeholder="Ex: Sobrecarga de trabalho" value={form.riskIdentified} onChange={(e) => setForm((c) => ({ ...c, riskIdentified: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Seção</label>
            <input className={inputClass} placeholder="Ex: Jornada e pausas" value={form.sectionName} onChange={(e) => setForm((c) => ({ ...c, sectionName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Medida recomendada *</label>
            <textarea className={`${inputClass} min-h-24 resize-none`} placeholder="Descreva a intervenção proposta..." value={form.measure} onChange={(e) => setForm((c) => ({ ...c, measure: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Responsável</label>
            <input className={inputClass} placeholder="Nome ou cargo" value={form.ownerName} onChange={(e) => setForm((c) => ({ ...c, ownerName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Prazo</label>
            <input className={inputClass} type="date" value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} />
          </div>
          <button
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            onClick={createPlan}
            disabled={isCreating || !form.riskIdentified || !form.measure}
            type="button"
          >
            {isCreating ? "Criando..." : "Criar ação"}
          </button>
        </div>
      </aside>
    </div>
  );
}
