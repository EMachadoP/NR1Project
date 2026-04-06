import { z } from "zod";

export const actionPlanSchema = z.object({
  campaignId: z.string().uuid(),
  riskIdentified: z.string().min(3),
  sectionName: z.string().min(2).optional().nullable(),
  rootCause: z.string().max(4000).optional().nullable(),
  measure: z.string().min(3),
  ownerName: z.string().max(120).optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).default("open"),
  origin: z.enum(["manual", "ai", "analytical_report"]).default("manual")
});

export const actionPlanPatchSchema = actionPlanSchema.partial().extend({
  id: z.string().uuid()
});

export type ActionPlanInput = z.infer<typeof actionPlanSchema>;
export type ActionPlanPatchInput = z.infer<typeof actionPlanPatchSchema>;
