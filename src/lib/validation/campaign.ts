import { z } from "zod";

export const campaignCreateSchema = z.object({
  questionnaireId: z.string().uuid(),
  name: z.string().min(3),
  sector: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  language: z.string().default("pt-BR"),
  startDate: z.string().date(),
  endDate: z.string().date()
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
