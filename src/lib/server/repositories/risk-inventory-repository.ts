import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import type {
  RiskInventoryClassification,
  RiskInventoryInput,
  RiskInventoryPatchInput,
  RiskInventoryStatus,
  RiskInventoryVersionStatus
} from "@/lib/validation/risk-inventory";

export type RiskInventoryRecord = {
  id: string;
  campaign_id: string;
  risk_inventory_version_id: string;
  origin_item_id: string | null;
  sector: string | null;
  unit: string | null;
  hazard_code: number | null;
  title: string;
  description: string;
  existing_controls: string | null;
  responsible_name: string | null;
  status: RiskInventoryStatus;
  probability: number;
  severity: number;
  nro: number;
  risk_classification: RiskInventoryClassification;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RiskInventoryExportRow = RiskInventoryRecord;

export type RiskInventoryVersionRecord = {
  id: string;
  campaign_id: string;
  version_number: number;
  status: RiskInventoryVersionStatus;
  title: string | null;
  summary_note: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  published_by: string | null;
  published_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_note: string | null;
  supersedes_version_id: string | null;
  archived_at: string | null;
  archived_reason: string | null;
};

type RiskInventoryListQuery = {
  riskInventoryVersionId?: string;
  campaignIds?: string[];
  riskClassification?: RiskInventoryClassification;
  sector?: string | null;
  unit?: string | null;
};

type RiskInventoryWritePayload = {
  campaignId?: string | null;
  riskInventoryVersionId?: string | null;
  sector?: string | null;
  unit?: string | null;
  hazardCode?: number | null;
  title?: string;
  description?: string;
  existingControls?: string | null;
  responsibleName?: string | null;
  status?: RiskInventoryInput["status"];
  probability?: number;
  severity?: number;
  nro?: number;
  riskClassification?: RiskInventoryClassification;
};

const RISK_INVENTORY_VERSION_SELECT = [
  "id",
  "campaign_id",
  "version_number",
  "status",
  "title",
  "summary_note",
  "created_by",
  "created_at",
  "updated_by",
  "updated_at",
  "published_by",
  "published_at",
  "approved_by",
  "approved_at",
  "approval_note",
  "supersedes_version_id",
  "archived_at",
  "archived_reason"
].join(", ");

const RISK_INVENTORY_SELECT = [
  "id",
  "campaign_id",
  "risk_inventory_version_id",
  "origin_item_id",
  "sector",
  "unit",
  "hazard_code",
  "title",
  "description",
  "existing_controls",
  "responsible_name",
  "status",
  "probability",
  "severity",
  "nro",
  "risk_classification",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at"
].join(", ");



export async function listRiskInventoryVersions(campaignId: string): Promise<RiskInventoryVersionRecord[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .select(RISK_INVENTORY_VERSION_SELECT)
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as RiskInventoryVersionRecord[];
}

export async function getRiskInventoryVersionById(id: string): Promise<RiskInventoryVersionRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("risk_inventory_versions").select(RISK_INVENTORY_VERSION_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as RiskInventoryVersionRecord | null;
}

export async function getPublishedRiskInventoryVersion(campaignId: string): Promise<RiskInventoryVersionRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .select(RISK_INVENTORY_VERSION_SELECT)
    .eq("campaign_id", campaignId)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as unknown as RiskInventoryVersionRecord | null;
}

export async function getDraftRiskInventoryVersion(campaignId: string): Promise<RiskInventoryVersionRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .select(RISK_INVENTORY_VERSION_SELECT)
    .eq("campaign_id", campaignId)
    .eq("status", "draft")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as unknown as RiskInventoryVersionRecord | null;
}

export async function listRiskInventoryItems(filters: RiskInventoryListQuery = {}): Promise<RiskInventoryRecord[]> {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("risk_inventory_items")
    .select(RISK_INVENTORY_SELECT)
    .order("nro", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters.campaignIds) {
    if (filters.campaignIds.length === 0) {
      return [];
    }

    query = query.in("campaign_id", filters.campaignIds);
  }

  if (filters.riskInventoryVersionId) {
    query = query.eq("risk_inventory_version_id", filters.riskInventoryVersionId);
  }

  if (filters.riskClassification) {
    query = query.eq("risk_classification", filters.riskClassification);
  }

  if (filters.sector) {
    query = query.eq("sector", filters.sector);
  }

  if (filters.unit) {
    query = query.eq("unit", filters.unit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RiskInventoryRecord[];
}

export async function getRiskInventoryItemById(id: string): Promise<RiskInventoryRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("risk_inventory_items").select(RISK_INVENTORY_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as RiskInventoryRecord | null;
}

export async function listRiskInventoryExportRows(versionId: string): Promise<RiskInventoryExportRow[]> {
  const rows = await listRiskInventoryItems({ riskInventoryVersionId: versionId });
  return rows as RiskInventoryExportRow[];
}

export async function createRiskInventoryVersion(input: {
  campaignId: string;
  versionNumber: number;
  status: "draft";
  title?: string | null;
  createdBy: string;
}): Promise<RiskInventoryVersionRecord> {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .insert({
      campaign_id: input.campaignId,
      version_number: input.versionNumber,
      status: input.status,
      title: input.title ?? null,
      summary_note: null,
      created_by: input.createdBy,
      created_at: now,
      updated_by: input.createdBy,
      updated_at: now,
      published_by: null,
      published_at: null,
      approved_by: null,
      approved_at: null,
      approval_note: null,
      supersedes_version_id: null,
      archived_at: null,
      archived_reason: null
    })
    .select(RISK_INVENTORY_VERSION_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as RiskInventoryVersionRecord;
}

export async function cloneRiskInventoryItemsIntoVersion(input: {
  sourceVersionId: string;
  targetVersionId: string;
  actorId: string;
}): Promise<RiskInventoryRecord[]> {
  const [sourceVersion, targetVersion] = await Promise.all([
    getRiskInventoryVersionById(input.sourceVersionId),
    getRiskInventoryVersionById(input.targetVersionId)
  ]);

  if (!sourceVersion || !targetVersion) {
    throw new Error("NOT_FOUND");
  }

  if (sourceVersion.campaign_id !== targetVersion.campaign_id) {
    throw new Error("VERSION_CAMPAIGN_MISMATCH");
  }

  const sourceItems = await listRiskInventoryItems({ riskInventoryVersionId: input.sourceVersionId });
  if (sourceItems.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const payload = sourceItems.map((item) => ({
    campaign_id: targetVersion.campaign_id,
    risk_inventory_version_id: input.targetVersionId,
    origin_item_id: item.origin_item_id ?? item.id,
    sector: item.sector,
    unit: item.unit,
    hazard_code: item.hazard_code,
    title: item.title,
    description: item.description,
    existing_controls: item.existing_controls,
    responsible_name: item.responsible_name,
    status: item.status,
    probability: item.probability,
    severity: item.severity,
    nro: item.nro,
    risk_classification: item.risk_classification,
    created_by: input.actorId,
    updated_by: input.actorId,
    created_at: now,
    updated_at: now
  }));

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("risk_inventory_items").insert(payload).select(RISK_INVENTORY_SELECT);
  if (error) throw error;
  return (data ?? []) as unknown as RiskInventoryRecord[];
}

export async function createRiskInventoryItem(
  input: RiskInventoryInput,
  derived: { nro: number; riskClassification: RiskInventoryClassification },
  actorId: string
): Promise<RiskInventoryRecord> {
  const supabase = createAdminSupabaseClient();
  const version = await getRiskInventoryVersionById(input.riskInventoryVersionId);

  if (!version) {
    throw new Error("NOT_FOUND");
  }

  const { data, error } = await supabase
    .from("risk_inventory_items")
    .insert({
      campaign_id: version.campaign_id,
      risk_inventory_version_id: input.riskInventoryVersionId,
      origin_item_id: null,
      sector: input.sector ?? null,
      unit: input.unit ?? null,
      hazard_code: input.hazardCode ?? null,
      title: input.title,
      description: input.description,
      existing_controls: input.existingControls ?? null,
      responsible_name: input.responsibleName ?? null,
      status: input.status,
      probability: input.probability,
      severity: input.severity,
      nro: derived.nro,
      risk_classification: derived.riskClassification,
      created_by: actorId,
      updated_by: actorId
    })
    .select(RISK_INVENTORY_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as RiskInventoryRecord;
}

export async function updateRiskInventoryItem(
  input: RiskInventoryPatchInput,
  payload: RiskInventoryWritePayload & { nro: number; riskClassification: RiskInventoryClassification },
  actorId: string
): Promise<RiskInventoryRecord> {
  const supabase = createAdminSupabaseClient();
  const updatePayload: Record<string, unknown> = {
    updated_by: actorId,
    updated_at: new Date().toISOString(),
    nro: payload.nro,
    risk_classification: payload.riskClassification
  };

  if (payload.sector !== undefined) updatePayload.sector = payload.sector;
  if (payload.unit !== undefined) updatePayload.unit = payload.unit;
  if (payload.hazardCode !== undefined) updatePayload.hazard_code = payload.hazardCode;
  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.existingControls !== undefined) updatePayload.existing_controls = payload.existingControls;
  if (payload.responsibleName !== undefined) updatePayload.responsible_name = payload.responsibleName;
  if (payload.status !== undefined) updatePayload.status = payload.status;
  if (payload.probability !== undefined) updatePayload.probability = payload.probability;
  if (payload.severity !== undefined) updatePayload.severity = payload.severity;

  const { data, error } = await supabase
    .from("risk_inventory_items")
    .update(updatePayload)
    .eq("id", input.id)
    .select(RISK_INVENTORY_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as RiskInventoryRecord;
}

export async function archiveRiskInventoryVersion(input: {
  versionId: string;
  actorId: string;
  archivedReason: string;
}): Promise<RiskInventoryVersionRecord> {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .update({
      status: "archived",
      archived_at: now,
      archived_reason: input.archivedReason,
      updated_by: input.actorId,
      updated_at: now
    })
    .eq("id", input.versionId)
    .select(RISK_INVENTORY_VERSION_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as RiskInventoryVersionRecord;
}

export async function publishRiskInventoryVersionAtomic(input: {
  versionId: string;
  actorId: string;
  approvalNote: string | null;
}): Promise<RiskInventoryVersionRecord> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("publish_risk_inventory_version", {
    p_version_id: input.versionId,
    p_actor_id: input.actorId,
    p_approval_note: input.approvalNote
  });

  if (error) throw error;

  if (Array.isArray(data)) {
    const [row] = data;
    if (row) {
      return row as unknown as RiskInventoryVersionRecord;
    }
  } else if (data) {
    return data as unknown as RiskInventoryVersionRecord;
  }

  const published = await getRiskInventoryVersionById(input.versionId);
  if (!published) {
    throw new Error("NOT_FOUND");
  }

  return published;
}

// Legacy non-atomic helper. Prefer publishRiskInventoryVersionAtomic for new publish flows.
export async function publishRiskInventoryVersionRecord(input: {
  versionId: string;
  actorId: string;
  approvalNote: string | null;
  supersedesVersionId?: string | null;
}): Promise<RiskInventoryVersionRecord> {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("risk_inventory_versions")
    .update({
      status: "published",
      published_by: input.actorId,
      published_at: now,
      approved_by: input.actorId,
      approved_at: now,
      approval_note: input.approvalNote,
      supersedes_version_id: input.supersedesVersionId ?? null,
      updated_by: input.actorId,
      updated_at: now
    })
    .eq("id", input.versionId)
    .select(RISK_INVENTORY_VERSION_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as RiskInventoryVersionRecord;
}

export async function deleteRiskInventoryItem(id: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("risk_inventory_items").delete().eq("id", id);
  if (error) throw error;
}

export async function createRiskInventoryHistory(params: {
  riskInventoryItemId?: string | null;
  changedBy: string;
  changeReason?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("risk_inventory_history").insert({
    risk_inventory_item_id: params.riskInventoryItemId ?? null,
    changed_by: params.changedBy,
    change_reason: params.changeReason ?? null,
    before_json: params.beforeJson ?? null,
    after_json: params.afterJson ?? null
  });

  if (error) throw error;
}




