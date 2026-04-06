import { z } from "zod";

export const indicatorSchema = z.object({
  campaignId: z.string().uuid(),
  periodLabel: z.string().min(1),
  indicatorName: z.string().min(2),
  previousValue: z.coerce.number().optional().nullable(),
  currentValue: z.coerce.number(),
  targetValue: z.coerce.number().optional().nullable()
});

export const indicatorPatchSchema = indicatorSchema.partial().extend({
  id: z.string().uuid()
});

export type IndicatorInput = z.infer<typeof indicatorSchema>;
export type IndicatorPatchInput = z.infer<typeof indicatorPatchSchema>;
