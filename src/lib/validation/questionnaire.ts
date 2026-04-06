import { z } from "zod";

export const scoringDirectionSchema = z.enum(["positive", "negative"]);

export const questionnaireQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  prompt: z.string().min(1),
  answerType: z.enum(["likert_1_5", "text"]).default("likert_1_5"),
  scoringDirection: scoringDirectionSchema,
  weight: z.number().positive().default(1),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  orderIndex: z.number().int().nonnegative()
});

export const questionnaireSectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  questions: z.array(questionnaireQuestionSchema).min(1)
});

export const questionnaireDraftSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sections: z.array(questionnaireSectionSchema).min(1)
});

export function assertQuestionnaireCanPublish(input: z.infer<typeof questionnaireDraftSchema>) {
  return questionnaireDraftSchema.parse(input);
}
