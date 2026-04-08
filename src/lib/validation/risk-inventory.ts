import { z } from "zod";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const optionalTrimmedText = z.preprocess(emptyStringToNull, z.string().trim().min(1).optional().nullable());
const optionalPositiveInt = z.preprocess(emptyStringToNull, z.coerce.number().int().positive().optional().nullable());
const nullableApprovalNote = z.preprocess(emptyStringToNull, z.string().trim().max(1000).optional().nullable());

export const riskInventoryClassificationSchema = z.enum(["Baixo", "Medio", "Alto", "Critico"]);
export const riskInventoryStatusSchema = z.enum(["open", "monitoring", "mitigating", "closed"]);
export const riskInventoryVersionStatusSchema = z.enum(["draft", "published", "archived"]);
export const riskMatrixScoreSchema = z.coerce.number().int().min(1).max(5);

export const createRiskInventoryRevisionSchema = z.object({
  campaignId: z.string().uuid(),
  mode: z.enum(["copy_latest_published", "empty"])
});

export const publishRiskInventoryVersionSchema = z.object({
  versionId: z.string().uuid(),
  approvalNote: nullableApprovalNote
});

export const riskInventoryVersionListSchema = z.object({
  campaignId: z.string().uuid()
});

export const riskInventorySchema = z.object({
  riskInventoryVersionId: z.string().uuid(),
  sector: optionalTrimmedText,
  unit: optionalTrimmedText,
  hazardCode: optionalPositiveInt,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  existingControls: optionalTrimmedText,
  responsibleName: optionalTrimmedText,
  status: riskInventoryStatusSchema,
  probability: riskMatrixScoreSchema,
  severity: riskMatrixScoreSchema
});

export const riskInventoryPatchSchema = riskInventorySchema.omit({ riskInventoryVersionId: true }).partial().extend({
  id: z.string().uuid()
});

export const riskInventoryListFiltersSchema = z.object({
  campaignId: z.string().uuid().optional(),
  riskClassification: riskInventoryClassificationSchema.optional()
});

export type RiskInventoryInput = z.infer<typeof riskInventorySchema>;
export type RiskInventoryPatchInput = z.infer<typeof riskInventoryPatchSchema>;
export type RiskInventoryListFilters = z.infer<typeof riskInventoryListFiltersSchema>;
export type RiskInventoryClassification = z.infer<typeof riskInventoryClassificationSchema>;
export type RiskInventoryStatus = z.infer<typeof riskInventoryStatusSchema>;
export type RiskInventoryVersionStatus = z.infer<typeof riskInventoryVersionStatusSchema>;
export type CreateRiskInventoryRevisionInput = z.infer<typeof createRiskInventoryRevisionSchema>;
export type PublishRiskInventoryVersionInput = z.infer<typeof publishRiskInventoryVersionSchema>;
export type RiskInventoryVersionListInput = z.infer<typeof riskInventoryVersionListSchema>;
