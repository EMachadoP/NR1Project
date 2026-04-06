import { z } from "zod";

export const answerSchema = z.object({
  questionId: z.string().min(1),
  answerRaw: z.number().int().min(1).max(5)
}).strict();

export const anonymousSubmissionSchema = z.object({
  token: z.string().min(12),
  observationText: z.string().max(4000).optional(),
  answers: z.array(answerSchema).min(1)
}).strict();

export type AnonymousSubmissionInput = z.infer<typeof anonymousSubmissionSchema>;
