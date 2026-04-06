import type { PortalSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/server/audit/logging";
import { buildFallbackRecommendations } from "@/lib/server/ai/fallback";
import { AI_RECOMMENDATIONS_SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from "@/lib/server/ai/system-prompt";
import { upsertCampaignAnalysisAiMetadata } from "@/lib/server/repositories/analysis-results-repository";
import { getEnv } from "@/lib/validation/env";
import {
  aiRecommendationsInputSchema,
  aiRecommendationsOutputSchema,
  type AiRecommendationsInput,
  type AiRecommendationsOutput
} from "@/lib/validation/ai-recommendations";

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\bdiagn[oó]stic/iu,
  /\bcid[-\s:]?\d+/iu,
  /\bdepress[aã]o\b/iu,
  /\bansiedade\b/iu,
  /\bburnout\b/iu,
  /\btranstorno\b/iu,
  /\benfermidade\b/iu,
  /\bdoen[cç]a\b/iu,
  /\blaudo\b/iu,
  /\bpaciente\b/iu
];

const BLAME_ASSIGNMENT_PATTERNS = [
  /\bculpa\b/iu,
  /\bculpado\b/iu,
  /\bculpada\b/iu,
  /\bculpar\b/iu,
  /\bneglig[eê]ncia\b/iu,
  /\brespons[aá]vel direto\b/iu,
  /\bresponsabilizar\b/iu,
  /\bfoi causado por\b/iu
];

export type AiSemanticViolationCode =
  | "MEDICAL_DIAGNOSIS_CONTENT"
  | "BLAME_ASSIGNMENT_CONTENT"
  | "UNKNOWN_SECTION_REFERENCE"
  | "HIGH_RISK_WITHOUT_HUMAN_VALIDATION"
  | "CRITICAL_WITHOUT_IMMEDIATE_PRIORITY";

function buildUserPrompt(input: AiRecommendationsInput) {
  return JSON.stringify(input, null, 2);
}

function extractJsonText(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const value = payload as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };

    if (typeof value.output_text === "string") {
      return value.output_text;
    }

    const contentText = value.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text)
      .find((item): item is string => typeof item === "string");

    if (contentText) {
      return contentText;
    }
  }

  return null;
}

function collectOutputText(output: AiRecommendationsOutput) {
  return [
    output.executiveSummary,
    ...output.recommendations.flatMap((item) => [
      item.riskIdentified,
      item.rootCauseSuggestion,
      item.preventiveMeasureSuggestion,
      item.dueDateSuggestion,
      item.monitoringFrequencySuggestion,
      item.rationale
    ])
  ].join("\n");
}

export function validateAiRecommendationsSemantics(input: AiRecommendationsInput, output: AiRecommendationsOutput): AiSemanticViolationCode[] {
  const violations = new Set<AiSemanticViolationCode>();
  const allText = collectOutputText(output);
  const sectionMap = new Map(input.sections.map((section) => [section.sectionId, section.label]));

  if (MEDICAL_DIAGNOSIS_PATTERNS.some((pattern) => pattern.test(allText))) {
    violations.add("MEDICAL_DIAGNOSIS_CONTENT");
  }

  if (BLAME_ASSIGNMENT_PATTERNS.some((pattern) => pattern.test(allText))) {
    violations.add("BLAME_ASSIGNMENT_CONTENT");
  }

  for (const recommendation of output.recommendations) {
    const label = sectionMap.get(recommendation.sectionId);

    if (!label) {
      violations.add("UNKNOWN_SECTION_REFERENCE");
      continue;
    }

    if ((label === "ALTO" || label === "CRITICO") && recommendation.requiresHumanValidation !== true) {
      violations.add("HIGH_RISK_WITHOUT_HUMAN_VALIDATION");
    }

    if (label === "CRITICO" && recommendation.priority !== "immediate") {
      violations.add("CRITICAL_WITHOUT_IMMEDIATE_PRIORITY");
    }
  }

  return Array.from(violations.values());
}

async function persistAndAuditAiResult(params: {
  actor: PortalSession;
  input: AiRecommendationsInput;
  output: AiRecommendationsOutput;
  semanticViolations: AiSemanticViolationCode[];
  reason: string;
}) {
  const analysisResultId = await upsertCampaignAnalysisAiMetadata({
    campaignId: params.input.campaign.id,
    aiInput: params.input,
    aiOutput: params.output
  });

  await writeAuditLog({
    actor: params.actor,
    entityType: "analysis_result",
    entityId: analysisResultId,
    action: params.semanticViolations.length > 0 ? "ai_guardrail_violation" : "ai_recommendations_generated",
    afterJson: {
      campaignId: params.input.campaign.id,
      fallbackUsed: params.output.fallbackUsed,
      promptVersion: params.output.promptVersion,
      recommendationCount: params.output.recommendations.length,
      semanticViolations: params.semanticViolations,
      reason: params.reason
    }
  });

  return analysisResultId;
}

export async function generateAiRecommendations(input: unknown, actor: PortalSession): Promise<AiRecommendationsOutput> {
  const parsedInput = aiRecommendationsInputSchema.parse(input);
  const env = getEnv();

  let result: AiRecommendationsOutput;
  let reason = "model_response_valid";
  let sourceViolations: AiSemanticViolationCode[] = [];

  if (!env.OPENAI_API_KEY) {
    result = buildFallbackRecommendations(parsedInput);
    reason = "missing_openai_api_key";
  } else {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          input: [
            { role: "system", content: AI_RECOMMENDATIONS_SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(parsedInput) }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        result = buildFallbackRecommendations(parsedInput);
        reason = `provider_http_${response.status}`;
      } else {
        const rawPayload = await response.json();
        const text = extractJsonText(rawPayload);

        if (!text) {
          result = buildFallbackRecommendations(parsedInput);
          reason = "provider_empty_text";
        } else {
          const parsedJson = JSON.parse(text);
          const validated = aiRecommendationsOutputSchema.parse({
            ...parsedJson,
            fallbackUsed: false,
            promptVersion: SYSTEM_PROMPT_VERSION
          });

          sourceViolations = validateAiRecommendationsSemantics(parsedInput, validated);

          if (sourceViolations.length > 0) {
            result = buildFallbackRecommendations(parsedInput);
            reason = "semantic_guardrail_violation";
          } else {
            result = validated;
          }
        }
      }
    } catch {
      result = buildFallbackRecommendations(parsedInput);
      reason = "provider_exception";
    }
  }

  await persistAndAuditAiResult({
    actor,
    input: parsedInput,
    output: result,
    semanticViolations: sourceViolations,
    reason
  });

  return result;
}
