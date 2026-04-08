"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { RiskMatrixCriteria } from "@/components/portal/risk-matrix-criteria";
import { RiskMatrixPreview } from "@/components/portal/risk-matrix-preview";
import type { PortalRole } from "@/lib/auth/session";

type CampaignSummary = {
  id: string;
  name: string;
  sector: string | null;
  unit: string | null;
};

type RiskClassification = "Baixo" | "Medio" | "Alto" | "Critico";
type RiskStatus = "open" | "monitoring" | "mitigating" | "closed";
type RiskInventoryVersionStatus = "draft" | "published" | "archived";

type RiskInventoryItem = {
  id: string;
  campaign_id: string | null;
  risk_inventory_version_id?: string;
  sector: string | null;
  unit: string | null;
  hazard_code: number | null;
  title: string;
  description: string;
  existing_controls: string | null;
  responsible_name: string | null;
  status: RiskStatus;
  probability: number;
  severity: number;
  nro: number;
  risk_classification: RiskClassification;
};

type RiskInventoryVersionSummary = {
  id: string;
  campaign_id: string;
  version_number: number;
  status: RiskInventoryVersionStatus;
  title: string | null;
  summary_note: string | null;
  created_at: string;
  published_at: string | null;
  approval_note: string | null;
  archived_at: string | null;
  archived_reason: string | null;
};

type RiskInventoryVersionDetail = RiskInventoryVersionSummary & {
  items: RiskInventoryItem[];
};

type RiskInventoryManagerProps = {
  campaigns: CampaignSummary[];
  initialCampaignId?: string;
  initialVersionId?: string;
  initialClassification: RiskClassification | null;
  versions: RiskInventoryVersionSummary[];
  selectedVersion: RiskInventoryVersionDetail | null;
  sessionRole: PortalRole;
};

const classificationConfig: Record<RiskClassification, { card: string; pill: string }> = {
  Baixo: { card: "bg-emerald-50 text-emerald-700 ring-emerald-200", pill: "bg-emerald-500" },
  Medio: { card: "bg-yellow-50 text-yellow-700 ring-yellow-200", pill: "bg-yellow-400" },
  Alto: { card: "bg-orange-50 text-orange-700 ring-orange-200", pill: "bg-orange-500" },
  Critico: { card: "bg-red-50 text-red-700 ring-red-200", pill: "bg-red-600" }
};

const versionStatusLabels: Record<RiskInventoryVersionStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived"
};

const versionStatusClass: Record<RiskInventoryVersionStatus, string> = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-600 ring-slate-200"
};

const statusLabels: Record<RiskStatus, string> = {
  open: "Aberto",
  monitoring: "Monitorando",
  mitigating: "Mitigando",
  closed: "Encerrado"
};

const classificationOptions: Array<RiskClassification | "all"> = ["all", "Baixo", "Medio", "Alto", "Critico"];
const scoreOptions = [1, 2, 3, 4, 5];
const statusOptions: RiskStatus[] = ["open", "monitoring", "mitigating", "closed"];
const inputClass = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

function sortItems(items: RiskInventoryItem[]) {
  return [...items].sort((left, right) => right.nro - left.nro || left.title.localeCompare(right.title));
}

function buildHref(campaignId?: string, versionId?: string | null, riskClassification?: RiskClassification | null) {
  const params = new URLSearchParams();
  if (campaignId) params.set("campaignId", campaignId);
  if (versionId) params.set("versionId", versionId);
  if (riskClassification) params.set("riskClassification", riskClassification);
  const query = params.toString();
  return query ? `/inventario-riscos?${query}` : "/inventario-riscos";
}

function deriveClassification(nro: number): RiskClassification {
  if (nro >= 15) return "Critico";
  if (nro >= 10) return "Alto";
  if (nro >= 5) return "Medio";
  return "Baixo";
}

function withDerivedValues(item: RiskInventoryItem): RiskInventoryItem {
  const nro = item.probability * item.severity;
  return { ...item, nro, risk_classification: deriveClassification(nro) };
}

function replaceItem(items: RiskInventoryItem[], nextItem: RiskInventoryItem) {
  return sortItems(items.map((item) => (item.id === nextItem.id ? nextItem : item)));
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

export function RiskInventoryManager({
  campaigns,
  initialCampaignId,
  initialVersionId,
  initialClassification,
  versions,
  selectedVersion,
  sessionRole
}: RiskInventoryManagerProps) {
  const router = useRouter();
  const selectedCampaign = campaigns.find((campaign) => campaign.id === initialCampaignId);
  const hasPublishedVersion = versions.some((version) => version.status === "published");
  const hasDraftVersion = versions.some((version) => version.status === "draft");
  const isDraftVersion = selectedVersion?.status === "draft";
  const canCreateRevision = sessionRole === "admin" || sessionRole === "hr";
  const canCreateEmptyRevision = sessionRole === "admin";
  const canCreate = sessionRole === "admin" && isDraftVersion;
  const canDelete = sessionRole === "admin" && isDraftVersion;
  const canEdit = (sessionRole === "admin" || sessionRole === "hr") && isDraftVersion;
  const canEditSeverity = sessionRole === "admin" && isDraftVersion;

  const [allItems, setAllItems] = useState(sortItems(selectedVersion?.items ?? []));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [revisionMode, setRevisionMode] = useState<"copy_latest_published" | "empty" | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sector: selectedCampaign?.sector ?? "",
    unit: selectedCampaign?.unit ?? "",
    existingControls: "",
    responsibleName: "",
    status: "open" as RiskStatus,
    probability: 3,
    severity: 3,
    hazardCode: ""
  });

  useEffect(() => {
    setAllItems(sortItems(selectedVersion?.items ?? []));
  }, [selectedVersion]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      sector: selectedCampaign?.sector ?? "",
      unit: selectedCampaign?.unit ?? ""
    }));
  }, [selectedCampaign?.id, selectedCampaign?.sector, selectedCampaign?.unit]);

  const inventoryItems = initialClassification ? allItems.filter((item) => item.risk_classification === initialClassification) : allItems;
  const counts = {
    total: allItems.length,
    visible: inventoryItems.length,
    Baixo: allItems.filter((item) => item.risk_classification === "Baixo").length,
    Medio: allItems.filter((item) => item.risk_classification === "Medio").length,
    Alto: allItems.filter((item) => item.risk_classification === "Alto").length,
    Critico: allItems.filter((item) => item.risk_classification === "Critico").length
  };

  async function createRevision(mode: "copy_latest_published" | "empty") {
    if (!initialCampaignId || !canCreateRevision) return;
    setFeedback(null);
    setRevisionMode(mode);
    const response = await fetch("/api/admin/risk-inventory/revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: initialCampaignId, mode })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.revision?.id) {
      router.push(buildHref(initialCampaignId, payload.revision.id, initialClassification) as Route);
      router.refresh();
      return;
    }
    setFeedback(readApiError(payload, "Nao foi possivel criar a revisao."));
    setRevisionMode(null);
  }

  async function publishVersion() {
    if (!selectedVersion || !isDraftVersion) return;
    setFeedback(null);
    setIsPublishing(true);
    const response = await fetch(`/api/admin/risk-inventory/versions/${selectedVersion.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalNote: null })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.version?.id) {
      router.push(buildHref(initialCampaignId, payload.version.id, initialClassification) as Route);
      router.refresh();
      return;
    }
    setFeedback(readApiError(payload, "Nao foi possivel publicar a revisao."));
    setIsPublishing(false);
  }


  async function exportPublishedVersion() {
    if (!selectedVersion || selectedVersion.status !== "published") return;
    setFeedback(null);
    setIsExporting(true);
    const response = await fetch(`/api/admin/risk-inventory/versions/${selectedVersion.id}/export`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      setFeedback(readApiError(payload, "Nao foi possivel exportar a revisao publicada."));
      setIsExporting(false);
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventario-riscos-v${selectedVersion.version_number}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  }

  async function createItem() {
    if (!canCreate || !selectedVersion) return;
    setFeedback(null);
    setIsCreating(true);
    const response = await fetch("/api/admin/risk-inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        riskInventoryVersionId: selectedVersion.id,
        title: form.title,
        description: form.description,
        sector: form.sector || null,
        unit: form.unit || null,
        existingControls: form.existingControls || null,
        responsibleName: form.responsibleName || null,
        status: form.status,
        probability: form.probability,
        severity: form.severity,
        hazardCode: form.hazardCode ? Number(form.hazardCode) : null
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.item) {
      setAllItems((current) => sortItems([payload.item as RiskInventoryItem, ...current]));
      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        existingControls: "",
        responsibleName: "",
        status: "open",
        probability: 3,
        severity: 3,
        hazardCode: ""
      }));
    } else {
      setFeedback(readApiError(payload, "Nao foi possivel cadastrar o risco."));
    }
    setIsCreating(false);
  }

  function updateDraft(id: string, patch: Partial<RiskInventoryItem>) {
    setAllItems((current) => current.map((item) => (item.id === id ? withDerivedValues({ ...item, ...patch }) : item)));
  }

  async function saveItem(item: RiskInventoryItem) {
    if (!canEdit) return;
    setFeedback(null);
    setBusyId(item.id);
    const response = await fetch(`/api/admin/risk-inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        description: item.description,
        sector: item.sector,
        unit: item.unit,
        existingControls: item.existing_controls,
        responsibleName: item.responsible_name,
        status: item.status,
        probability: item.probability,
        ...(canEditSeverity ? { severity: item.severity } : {}),
        hazardCode: item.hazard_code
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.item) {
      setAllItems((current) => replaceItem(current, payload.item as RiskInventoryItem));
    } else {
      setFeedback(readApiError(payload, "Nao foi possivel salvar o risco."));
    }
    setBusyId(null);
  }

  async function deleteItem(id: string) {
    if (!canDelete) return;
    setFeedback(null);
    setBusyId(id);
    const response = await fetch(`/api/admin/risk-inventory/${id}`, { method: "DELETE" });
    if (response.ok) {
      setAllItems((current) => current.filter((item) => item.id !== id));
    } else {
      const payload = await response.json().catch(() => null);
      setFeedback(readApiError(payload, "Nao foi possivel excluir o risco."));
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {campaigns.map((campaign) => (
          <a
            key={campaign.id}
            href={buildHref(campaign.id, null, initialClassification)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              initialCampaignId === campaign.id
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-muted ring-1 ring-line hover:ring-accent/40"
            }`}
          >
            {campaign.name}
          </a>
        ))}
      </div>

      {selectedCampaign && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{selectedCampaign.name}</span>
                {selectedVersion && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${versionStatusClass[selectedVersion.status]}`}>
                    {versionStatusLabels[selectedVersion.status]}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {selectedVersion ? selectedVersion.title?.trim() || `Revisao ${selectedVersion.version_number}` : "Nenhuma revisao criada"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {selectedVersion
                    ? `Versao ${selectedVersion.version_number}${selectedVersion.published_at ? ` publicada em ${formatDate(selectedVersion.published_at)}` : " ainda nao publicada"}.`
                    : hasPublishedVersion
                      ? "Crie uma nova revisao a partir da published vigente."
                      : "Esta campanha ainda nao possui versao published para servir de base."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canCreateRevision && hasPublishedVersion && !hasDraftVersion && (
                <button
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/40 disabled:opacity-50"
                  onClick={() => createRevision("copy_latest_published")}
                  disabled={revisionMode !== null}
                  type="button"
                >
                  {revisionMode === "copy_latest_published" ? "Criando revisao..." : "Nova revisao"}
                </button>
              )}
              {canCreateEmptyRevision && !hasDraftVersion && (
                <button
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/40 disabled:opacity-50"
                  onClick={() => createRevision("empty")}
                  disabled={revisionMode !== null}
                  type="button"
                >
                  {revisionMode === "empty" ? "Criando revisao vazia..." : "Nova revisao vazia"}
                </button>
              )}
              {selectedVersion?.status === "published" && (
                <button
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/40 disabled:opacity-50"
                  onClick={exportPublishedVersion}
                  disabled={isExporting}
                  type="button"
                >
                  {isExporting ? "Exportando..." : "Exportar revisao oficial"}
                </button>
              )}
              {sessionRole === "admin" && isDraftVersion && selectedVersion && (
                <button
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
                  onClick={publishVersion}
                  disabled={isPublishing}
                  type="button"
                >
                  {isPublishing ? "Publicando..." : "Publicar revisao"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {versions.length === 0 ? (
              <span className="text-sm text-muted">Nenhuma versao registrada para esta campanha.</span>
            ) : (
              versions.map((version) => {
                const isActive = version.id === initialVersionId;
                return (
                  <a
                    key={version.id}
                    href={buildHref(initialCampaignId, version.id, initialClassification)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                      isActive ? "bg-slate-900 text-white ring-slate-900" : `${versionStatusClass[version.status]} bg-white`
                    }`}
                  >
                    {`V${version.version_number} · ${versionStatusLabels[version.status]}`}
                  </a>
                );
              })
            )}
          </div>

          {selectedVersion && (
            <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
              <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Criada em</p>
                <p className="mt-1 font-medium text-ink">{formatDate(selectedVersion.created_at) ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Publicacao</p>
                <p className="mt-1 font-medium text-ink">{formatDate(selectedVersion.published_at) ?? "Ainda nao publicada"}</p>
              </div>
              <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Observacao</p>
                <p className="mt-1 font-medium text-ink">{selectedVersion.approval_note ?? selectedVersion.archived_reason ?? "Sem observacoes"}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {feedback && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{feedback}</div>}

      <div className="flex flex-wrap gap-3">
        {classificationOptions.map((classification) => {
          const isActive = (classification === "all" && !initialClassification) || classification === initialClassification;
          const label = classification === "all" ? "Todos" : classification;
          return (
            <a
              key={classification}
              href={buildHref(initialCampaignId, initialVersionId, classification === "all" ? null : classification)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive ? "bg-slate-900 text-white" : "bg-white text-muted ring-1 ring-line hover:ring-slate-400"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-line bg-white p-4 shadow-card xl:col-span-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Resumo da revisao</p>
          <p className="mt-3 text-3xl font-bold text-ink">{counts.total}</p>
          <p className="mt-1 text-sm text-muted">{initialClassification ? `${counts.visible} visiveis no filtro atual.` : "Ordenados por NRO decrescente."}</p>
        </article>
        {(["Baixo", "Medio", "Alto", "Critico"] as RiskClassification[]).map((classification) => (
          <article key={classification} className={`rounded-xl border p-4 shadow-card ring-1 ${classificationConfig[classification].card}`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em]">{classification}</p>
            <p className="mt-3 text-3xl font-bold">{counts[classification]}</p>
            <p className="mt-1 text-sm opacity-80">Riscos nessa faixa.</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {!selectedVersion ? (
            <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">Nenhuma versao disponivel para esta campanha.</div>
          ) : inventoryItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">Nenhum risco encontrado para o filtro atual.</div>
          ) : (
            inventoryItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-line bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white ${classificationConfig[item.risk_classification].pill}`}>{item.risk_classification}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{statusLabels[item.status]}</span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Risco</label>
                        <input className={inputClass} value={item.title} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { title: event.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Responsavel</label>
                        <input className={inputClass} value={item.responsible_name ?? ""} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { responsible_name: event.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-muted">Descricao</label>
                        <textarea className={`${inputClass} min-h-24`} value={item.description} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { description: event.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Setor</label>
                        <input className={inputClass} value={item.sector ?? ""} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { sector: event.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Unidade</label>
                        <input className={inputClass} value={item.unit ?? ""} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { unit: event.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Codigo tecnico</label>
                        <input className={inputClass} value={item.hazard_code ?? ""} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { hazard_code: event.target.value ? Number(event.target.value) : null })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-muted">Controles existentes</label>
                        <textarea className={`${inputClass} min-h-20`} value={item.existing_controls ?? ""} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { existing_controls: event.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="w-full xl:w-[280px]"><RiskMatrixPreview probability={item.probability} severity={item.severity} /></div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Probabilidade</label>
                    <select className={inputClass} value={item.probability} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { probability: Number(event.target.value) })}>{scoreOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Severidade</label>
                    {canEditSeverity ? (
                      <select className={inputClass} value={item.severity} onChange={(event) => updateDraft(item.id, { severity: Number(event.target.value) })}>{scoreOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    ) : (
                      <div className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-ink">{item.severity}</div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Status</label>
                    <select className={inputClass} value={item.status} disabled={!canEdit} onChange={(event) => updateDraft(item.id, { status: event.target.value as RiskStatus })}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>
                  </div>
                  <div className="rounded-xl border border-line bg-slate-50 px-4 py-3"><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">NRO calculado</p><p className="mt-2 text-2xl font-bold text-ink">{item.nro}</p></div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    {canEdit && <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50" onClick={() => saveItem(item)} disabled={busyId === item.id} type="button">{busyId === item.id ? "Salvando..." : "Salvar alteracoes"}</button>}
                    {canDelete && <button className="rounded-lg border border-red-100 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:opacity-50" onClick={() => deleteItem(item.id)} disabled={busyId === item.id} type="button">Excluir risco</button>}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <div className="space-y-6">
          {selectedVersion && !isDraftVersion && <aside className="rounded-xl border border-line bg-white p-5 text-sm text-muted shadow-card">Esta versao esta em modo somente leitura. Crie uma nova revisao para editar os itens.</aside>}
          {canCreate && selectedVersion && (
            <aside className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Novo risco</p>
              <div className="mt-4 space-y-3">
                <div><label className="mb-1 block text-xs font-medium text-muted">Titulo</label><input className={inputClass} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
                <div><label className="mb-1 block text-xs font-medium text-muted">Descricao</label><textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-medium text-muted">Setor</label><input className={inputClass} value={form.sector} onChange={(event) => setForm((current) => ({ ...current, sector: event.target.value }))} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted">Unidade</label><input className={inputClass} value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-medium text-muted">Probabilidade</label><select className={inputClass} value={form.probability} onChange={(event) => setForm((current) => ({ ...current, probability: Number(event.target.value) }))}>{scoreOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted">Severidade</label><select className={inputClass} value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: Number(event.target.value) }))}>{scoreOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-medium text-muted">Status</label><select className={inputClass} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RiskStatus }))}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted">Codigo tecnico</label><input className={inputClass} value={form.hazardCode} onChange={(event) => setForm((current) => ({ ...current, hazardCode: event.target.value }))} /></div>
                </div>
                <div><label className="mb-1 block text-xs font-medium text-muted">Responsavel</label><input className={inputClass} value={form.responsibleName} onChange={(event) => setForm((current) => ({ ...current, responsibleName: event.target.value }))} /></div>
                <div><label className="mb-1 block text-xs font-medium text-muted">Controles existentes</label><textarea className={`${inputClass} min-h-20`} value={form.existingControls} onChange={(event) => setForm((current) => ({ ...current, existingControls: event.target.value }))} /></div>
                <button className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50" onClick={createItem} disabled={isCreating || !form.title || !form.description || !selectedVersion} type="button">{isCreating ? "Criando..." : "Cadastrar risco"}</button>
              </div>
            </aside>
          )}
          <RiskMatrixCriteria />
        </div>
      </div>
    </div>
  );
}











