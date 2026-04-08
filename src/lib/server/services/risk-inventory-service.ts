import { assertCampaignScope, assertRole } from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";
import { classifyNro, computeNro } from "@/lib/domain/risk-matrix/engine";
import { NRO_CLASSIFICATION_THRESHOLDS, RISK_MATRIX_SCORE_MAX, RISK_MATRIX_SCORE_MIN } from "@/lib/domain/risk-matrix/types";
import { writeAuditLog } from "@/lib/server/audit/logging";
import { getCampaign, listAccessibleCampaignIds } from "@/lib/server/repositories/campaigns-repository";
import {
  archiveRiskInventoryVersion,
  cloneRiskInventoryItemsIntoVersion,
  createRiskInventoryHistory,
  createRiskInventoryItem,
  createRiskInventoryVersion,
  deleteRiskInventoryItem,
  getDraftRiskInventoryVersion,
  getRiskInventoryItemById,
  getPublishedRiskInventoryVersion,
  getRiskInventoryVersionById,
  listRiskInventoryItems,
  listRiskInventoryVersions,
  publishRiskInventoryVersionAtomic,
  type RiskInventoryVersionRecord,
  updateRiskInventoryItem
} from "@/lib/server/repositories/risk-inventory-repository";
import {
  createRiskInventoryRevisionSchema,
  publishRiskInventoryVersionSchema,
  riskInventoryListFiltersSchema,
  riskInventoryPatchSchema,
  riskInventorySchema,
  riskInventoryVersionListSchema
} from "@/lib/validation/risk-inventory";

function deriveRiskMatrixValues(probability: number, severity: number) {
  const nro = computeNro({ probability: probability as 1 | 2 | 3 | 4 | 5, severity: severity as 1 | 2 | 3 | 4 | 5 });
  const classification = classifyNro(nro);

  return {
    nro,
    riskClassification: classification.label
  };
}

async function runRiskInventorySideEffects(tasks: Array<() => Promise<void>>) {
  const results = await Promise.allSettled(tasks.map((task) => task()));

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("risk_inventory_side_effect_failed", result.reason);
    }
  }
}

function assertDraftVersion(version: RiskInventoryVersionRecord | null): asserts version is RiskInventoryVersionRecord & { status: "draft" } {
  if (!version) throw new Error("NOT_FOUND");
  if (version.status !== "draft") throw new Error("VERSION_NOT_EDITABLE");
}

function normalizeRiskInventoryVersionWorkflowError(error: unknown): never {
  if (error instanceof Error && error.message === "VERSION_NOT_DRAFT") {
    throw new Error("VERSION_NOT_EDITABLE");
  }

  throw error;
}

export async function listRiskInventoryService(actor: PortalSession, input: unknown) {
  const filters = riskInventoryListFiltersSchema.parse(input);

  if (filters.campaignId) {
    const campaign = await getCampaign(filters.campaignId);
    assertCampaignScope(actor, campaign);

    return listRiskInventoryItems({
      campaignIds: [filters.campaignId],
      riskClassification: filters.riskClassification,
      sector: actor.role === "manager" ? actor.sector : undefined,
      unit: actor.role === "manager" ? actor.unit : undefined
    });
  }

  if (actor.role === "manager") {
    const accessibleCampaignIds = await listAccessibleCampaignIds(actor);
    return listRiskInventoryItems({
      campaignIds: accessibleCampaignIds,
      riskClassification: filters.riskClassification,
      sector: actor.sector,
      unit: actor.unit
    });
  }

  return listRiskInventoryItems({
    riskClassification: filters.riskClassification
  });
}

export async function listRiskInventoryVersionsService(actor: PortalSession, input: unknown) {
  const parsed = riskInventoryVersionListSchema.parse(input);
  const campaign = await getCampaign(parsed.campaignId);
  assertCampaignScope(actor, campaign);

  return listRiskInventoryVersions(parsed.campaignId);
}

export async function getRiskInventoryVersionDetailService(actor: PortalSession, versionId: string) {
  const version = await getRiskInventoryVersionById(versionId);

  if (!version) {
    throw new Error("NOT_FOUND");
  }

  const campaign = await getCampaign(version.campaign_id);
  assertCampaignScope(actor, campaign);

  return {
    ...version,
    items: await listRiskInventoryItems({
      riskInventoryVersionId: version.id,
      sector: actor.role === "manager" ? actor.sector : undefined,
      unit: actor.role === "manager" ? actor.unit : undefined
    })
  };
}

export async function createRiskInventoryRevisionService(actor: PortalSession, input: unknown) {
  const parsed = createRiskInventoryRevisionSchema.parse(input);
  assertRole(actor, parsed.mode === "empty" ? ["admin"] : ["admin", "hr"]);

  const campaign = await getCampaign(parsed.campaignId);
  assertCampaignScope(actor, campaign);

  const existingDraft = await getDraftRiskInventoryVersion(parsed.campaignId);
  if (existingDraft) throw new Error("DRAFT_ALREADY_EXISTS");

  const published = await getPublishedRiskInventoryVersion(parsed.campaignId);

  if (parsed.mode === "copy_latest_published" && !published) {
    throw new Error("NO_PUBLISHED_VERSION_TO_COPY");
  }

  const nextVersionNumber = (published?.version_number ?? 0) + 1;
  const draft = await createRiskInventoryVersion({
    campaignId: parsed.campaignId,
    versionNumber: nextVersionNumber,
    status: "draft",
    createdBy: actor.userId
  });

  if (parsed.mode === "copy_latest_published" && published) {
    try {
      await cloneRiskInventoryItemsIntoVersion({
        sourceVersionId: published.id,
        targetVersionId: draft.id,
        actorId: actor.userId
      });
    } catch (error) {
      try {
        await archiveRiskInventoryVersion({
          versionId: draft.id,
          actorId: actor.userId,
          archivedReason: "copy_failed_during_revision_creation"
        });
      } catch (compensationError) {
        console.error("risk_inventory_revision_copy_compensation_failed", compensationError);
      }

      throw error;
    }
  }

  return draft;
}

export async function publishRiskInventoryVersionService(actor: PortalSession, input: unknown) {
  assertRole(actor, ["admin"]);
  const parsed = publishRiskInventoryVersionSchema.parse(input);
  const draft = await getRiskInventoryVersionById(parsed.versionId);
  assertDraftVersion(draft);

  const campaign = await getCampaign(draft.campaign_id);
  assertCampaignScope(actor, campaign);

  try {
    return await publishRiskInventoryVersionAtomic({
      versionId: draft.id,
      actorId: actor.userId,
      approvalNote: parsed.approvalNote ?? null
    });
  } catch (error) {
    normalizeRiskInventoryVersionWorkflowError(error);
  }
}

export async function createRiskInventoryService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin"]);
  const parsed = riskInventorySchema.parse(input);
  const version = await getRiskInventoryVersionById(parsed.riskInventoryVersionId);
  assertDraftVersion(version);

  const campaign = await getCampaign(version.campaign_id);
  assertCampaignScope(actor, campaign);

  const derived = deriveRiskMatrixValues(parsed.probability, parsed.severity);
  const created = await createRiskInventoryItem(parsed, derived, actor.userId);

  await runRiskInventorySideEffects([
    () =>
      createRiskInventoryHistory({
        riskInventoryItemId: created.id,
        changedBy: actor.userId,
        changeReason: "create",
        afterJson: created
      }),
    () =>
      writeAuditLog({
        actor,
        entityType: "risk_inventory_item",
        entityId: created.id,
        action: "create",
        afterJson: created
      })
  ]);

  return created;
}

export async function updateRiskInventoryService(input: unknown, actor: PortalSession) {
  assertRole(actor, ["admin", "hr"]);
  const parsed = riskInventoryPatchSchema.parse(input);
  const before = await getRiskInventoryItemById(parsed.id);

  if (!before) {
    throw new Error("NOT_FOUND");
  }

  if (before.campaign_id) {
    const currentCampaign = await getCampaign(before.campaign_id);
    assertCampaignScope(actor, currentCampaign);
  }

  const version = await getRiskInventoryVersionById(before.risk_inventory_version_id);
  assertDraftVersion(version);

  if (actor.role === "hr" && parsed.severity !== undefined) {
    throw new Error("FORBIDDEN");
  }

  const finalProbability = parsed.probability ?? before.probability;
  const finalSeverity = parsed.severity ?? before.severity;
  const derived = deriveRiskMatrixValues(finalProbability, finalSeverity);

  const updated = await updateRiskInventoryItem(
    parsed,
    {
      sector: parsed.sector,
      unit: parsed.unit,
      hazardCode: parsed.hazardCode,
      title: parsed.title,
      description: parsed.description,
      existingControls: parsed.existingControls,
      responsibleName: parsed.responsibleName,
      status: parsed.status,
      probability: parsed.probability,
      severity: parsed.severity,
      nro: derived.nro,
      riskClassification: derived.riskClassification
    },
    actor.userId
  );

  await runRiskInventorySideEffects([
    () =>
      createRiskInventoryHistory({
        riskInventoryItemId: updated.id,
        changedBy: actor.userId,
        changeReason: "update",
        beforeJson: before,
        afterJson: updated
      }),
    () =>
      writeAuditLog({
        actor,
        entityType: "risk_inventory_item",
        entityId: updated.id,
        action: "update",
        beforeJson: before,
        afterJson: updated
      })
  ]);

  return updated;
}

export async function deleteRiskInventoryService(id: string, actor: PortalSession) {
  assertRole(actor, ["admin"]);
  const before = await getRiskInventoryItemById(id);

  if (!before) {
    throw new Error("NOT_FOUND");
  }

  if (before.campaign_id) {
    const campaign = await getCampaign(before.campaign_id);
    assertCampaignScope(actor, campaign);
  }

  const version = await getRiskInventoryVersionById(before.risk_inventory_version_id);
  assertDraftVersion(version);

  await deleteRiskInventoryItem(id);

  await runRiskInventorySideEffects([
    () =>
      createRiskInventoryHistory({
        changedBy: actor.userId,
        changeReason: "delete",
        beforeJson: before
      }),
    () =>
      writeAuditLog({
        actor,
        entityType: "risk_inventory_item",
        entityId: id,
        action: "delete",
        beforeJson: before
      })
  ]);
}
export async function exportRiskInventoryVersionService(actor: PortalSession, versionId: string) {
  const version = await getRiskInventoryVersionById(versionId);

  if (!version) {
    throw new Error("NOT_FOUND");
  }

  const campaign = await getCampaign(version.campaign_id);
  assertCampaignScope(actor, campaign);

  if (version.status !== "published") {
    throw new Error("VERSION_NOT_EXPORTABLE");
  }

  const items = await listRiskInventoryItems({
    riskInventoryVersionId: versionId,
    sector: actor.role === "manager" ? actor.sector : undefined,
    unit: actor.role === "manager" ? actor.unit : undefined
  });

  return {
    documentType: "risk_inventory_published_snapshot",
    campaign: {
      id: version.campaign_id
    },
    version: {
      id: version.id,
      versionNumber: version.version_number,
      status: version.status,
      title: version.title,
      summaryNote: version.summary_note,
      publishedAt: version.published_at,
      publishedBy: version.published_by,
      approvedAt: version.approved_at,
      approvedBy: version.approved_by,
      approvalNote: version.approval_note,
      supersedesVersionId: version.supersedes_version_id
    },
    matrixCriteria: {
      formula: "NRO = Probabilidade x Severidade",
      scoreRange: {
        min: RISK_MATRIX_SCORE_MIN,
        max: RISK_MATRIX_SCORE_MAX
      },
      classificationThresholds: NRO_CLASSIFICATION_THRESHOLDS.map((threshold) => ({
        min: threshold.min,
        label: threshold.label,
        colorToken: threshold.colorToken
      }))
    },
    summary: {
      itemCount: items.length,
      classifications: {
        Baixo: items.filter((item) => item.risk_classification === "Baixo").length,
        Medio: items.filter((item) => item.risk_classification === "Medio").length,
        Alto: items.filter((item) => item.risk_classification === "Alto").length,
        Critico: items.filter((item) => item.risk_classification === "Critico").length
      }
    },
    items: items.map((item) => ({
      id: item.id,
      originItemId: item.origin_item_id ?? null,
      sector: item.sector,
      unit: item.unit,
      hazardCode: item.hazard_code,
      title: item.title,
      description: item.description,
      existingControls: item.existing_controls,
      responsibleName: item.responsible_name,
      status: item.status,
      probability: item.probability,
      severity: item.severity,
      nro: item.nro,
      riskClassification: item.risk_classification,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  };
}






