import type { PortalRole, PortalSession } from "@/lib/auth/session";

export type AccessScope = "global" | "campaign_scope" | "individual_report_internal";
export type AdminEndpointRule = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  allowedRoles: PortalRole[];
  scope: AccessScope;
  notes: string;
};

export const ADMIN_ENDPOINT_ACCESS_MATRIX: AdminEndpointRule[] = [
  { method: "GET", path: "/api/admin/campaigns", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Gestor ve apenas campanhas do proprio setor/unidade." },
  { method: "GET", path: "/api/admin/campaigns/[id]", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Detalhe de campanha respeita escopo do Gestor." },
  { method: "PATCH", path: "/api/admin/campaigns/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Edicao restrita a Admin/RH." },
  { method: "GET", path: "/api/admin/campaigns/[id]/analytics", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Analytics consolidado respeita escopo do Gestor." },
  { method: "POST", path: "/api/admin/campaigns/[id]/report", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Gestor pode gerar apenas relatorio analitico da propria campanha." },
  { method: "POST", path: "/api/admin/campaigns/[id]/tokens", allowedRoles: ["admin", "hr"], scope: "global", notes: "Emissao de tokens e operacao administrativa." },
  { method: "GET", path: "/api/admin/questionnaires", allowedRoles: ["admin"], scope: "global", notes: "Questionarios administrativos ficam restritos a Admin." },
  { method: "POST", path: "/api/admin/questionnaires", allowedRoles: ["admin"], scope: "global", notes: "Criacao de questionario restrita a Admin." },
  { method: "GET", path: "/api/admin/questionnaires/[id]", allowedRoles: ["admin"], scope: "global", notes: "Detalhe de questionario restrito a Admin." },
  { method: "PATCH", path: "/api/admin/questionnaires/[id]", allowedRoles: ["admin"], scope: "global", notes: "Edicao de questionario restrita a Admin." },
  { method: "POST", path: "/api/admin/questionnaires/[id]/publish", allowedRoles: ["admin"], scope: "global", notes: "Publicacao restrita a Admin." },
  { method: "GET", path: "/api/admin/action-plans", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Gestor pode consultar planos apenas nas campanhas do proprio escopo." },
  { method: "POST", path: "/api/admin/action-plans", allowedRoles: ["admin", "hr"], scope: "global", notes: "Criacao de plano e restrita a Admin/RH." },
  { method: "PATCH", path: "/api/admin/action-plans/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Edicao de plano e restrita a Admin/RH." },
  { method: "DELETE", path: "/api/admin/action-plans/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Exclusao de plano e restrita a Admin/RH." },
  { method: "GET", path: "/api/admin/indicators", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Gestor pode consultar indicadores apenas nas campanhas do proprio escopo." },
  { method: "POST", path: "/api/admin/indicators", allowedRoles: ["admin", "hr"], scope: "global", notes: "Criacao de indicador e restrita a Admin/RH." },
  { method: "PATCH", path: "/api/admin/indicators/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Edicao de indicador e restrita a Admin/RH." },
  { method: "DELETE", path: "/api/admin/indicators/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Exclusao de indicador e restrita a Admin/RH." },
  { method: "GET", path: "/api/admin/reports/[id]/download", allowedRoles: ["admin", "hr", "manager"], scope: "individual_report_internal", notes: "Gestor nunca acessa relatorio individual; apenas analitico em campanha do proprio escopo." },
  { method: "POST", path: "/api/admin/ai/recommendations", allowedRoles: ["admin", "hr"], scope: "global", notes: "IA de recomendacao fica restrita a Admin/RH." }
];

type ScopedCampaign = {
  id: string;
  sector: string | null;
  unit: string | null;
};

export function hasRequiredRole(session: PortalSession, allowedRoles: PortalRole[]) {
  return allowedRoles.includes(session.role);
}

export function assertRole(session: PortalSession, allowedRoles: PortalRole[]) {
  if (!hasRequiredRole(session, allowedRoles)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function matchesManagerScope(session: PortalSession, campaign: ScopedCampaign) {
  if (session.role !== "manager") {
    return true;
  }

  const hasSectorScope = Boolean(session.sector);
  const hasUnitScope = Boolean(session.unit);

  if (!hasSectorScope && !hasUnitScope) {
    return false;
  }

  if (hasSectorScope && campaign.sector !== session.sector) {
    return false;
  }

  if (hasUnitScope && campaign.unit !== session.unit) {
    return false;
  }

  return true;
}

export function filterCampaignsBySessionScope<T extends ScopedCampaign>(session: PortalSession, campaigns: T[]) {
  if (session.role !== "manager") {
    return campaigns;
  }

  return campaigns.filter((campaign) => matchesManagerScope(session, campaign));
}

export function assertCampaignScope<T extends ScopedCampaign>(session: PortalSession, campaign: T | null | undefined) {
  if (!campaign) {
    throw new Error("NOT_FOUND");
  }

  if (!matchesManagerScope(session, campaign)) {
    throw new Error("FORBIDDEN");
  }

  return campaign;
}

export function assertInternalReportAccess(session: PortalSession, report: { report_type: "individual" | "campaign_analytical"; campaign_id: string | null }) {
  if (report.report_type === "individual" && session.role === "manager") {
    throw new Error("FORBIDDEN");
  }

  return report;
}

