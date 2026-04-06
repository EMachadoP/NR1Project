import { SYSTEM_PROMPT_VERSION } from "@/lib/server/ai/system-prompt";
import type { AiRecommendationsInput, AiRecommendationsOutput } from "@/lib/validation/ai-recommendations";

function buildPriority(label: AiRecommendationsInput["sections"][number]["label"]) {
  if (label === "CRITICO") return "immediate" as const;
  if (label === "ALTO") return "short_term" as const;
  return "planned" as const;
}

function buildDueDateSuggestion(label: AiRecommendationsInput["sections"][number]["label"]) {
  if (label === "CRITICO") return "24 a 72 horas";
  if (label === "ALTO") return "7 a 15 dias";
  if (label === "MEDIO") return "15 a 30 dias";
  return "30 a 60 dias";
}

function buildMonitoringFrequency(label: AiRecommendationsInput["sections"][number]["label"]) {
  if (label === "CRITICO") return "diaria ate estabilizacao";
  if (label === "ALTO") return "semanal";
  if (label === "MEDIO") return "quinzenal";
  return "mensal";
}

function buildMeasure(label: AiRecommendationsInput["sections"][number]["label"], sectionId: string) {
  if (label === "CRITICO") return `Executar intervencao imediata na secao ${sectionId}, revisar controles existentes e formalizar resposta do RH/Seguranca.`;
  if (label === "ALTO") return `Implementar ajuste operacional priorizado na secao ${sectionId} com monitoramento reforcado.`;
  if (label === "MEDIO") return `Planejar melhoria preventiva para a secao ${sectionId} e acompanhar aderencia.`;
  return `Manter rotina preventiva e revisar periodicamente a secao ${sectionId}.`;
}

export function buildFallbackRecommendations(input: AiRecommendationsInput): AiRecommendationsOutput {
  const sortedSections = [...input.sections].sort((a, b) => b.average - a.average);
  const recommendations = sortedSections.slice(0, Math.max(1, Math.min(5, sortedSections.length))).map((section) => ({
    priority: buildPriority(section.label),
    sectionId: section.sectionId,
    riskIdentified: `Risco ${section.label.toLowerCase()} na secao ${section.sectionId}`,
    rootCauseSuggestion: `Indicios de fragilidade organizacional ou operacional recorrente na secao ${section.sectionId}, a validar localmente pela equipe responsavel.`,
    preventiveMeasureSuggestion: buildMeasure(section.label, section.sectionId),
    dueDateSuggestion: buildDueDateSuggestion(section.label),
    monitoringFrequencySuggestion: buildMonitoringFrequency(section.label),
    requiresHumanValidation: section.label === "ALTO" || section.label === "CRITICO",
    rationale: `Secao com media ${section.average.toFixed(1)} e ${section.criticalItemCount} itens criticos no consolidado.`
  }));

  return {
    executiveSummary: `Campanha ${input.campaign.name} com ${input.summary.responseCount} respostas, ${input.summary.sectionCount} secoes avaliadas e ${input.summary.criticalItemsCount} itens criticos. Priorizar secoes com classificacao ALTO ou CRITICO e aplicar validacao humana obrigatoria nesses casos.`,
    recommendations,
    guardrailsApplied: {
      noMedicalDiagnosis: true,
      noBlameAssignment: true,
      humanValidationRequiredForHighRisk: true,
      companyRulesConsidered: true
    },
    fallbackUsed: true,
    promptVersion: SYSTEM_PROMPT_VERSION
  };
}
