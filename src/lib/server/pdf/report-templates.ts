import type { AnalyticalReportData, IndividualReportData, ReportTemplateVersion } from "@/lib/domain/reports/types";
import { reportDocument } from "@/lib/server/pdf/report-base";

const SCALE = [
  { range: "1.0-1.5", label: "MUITO BAIXO" },
  { range: "1.6-2.5", label: "BAIXO" },
  { range: "2.6-3.5", label: "MEDIO" },
  { range: "3.6-4.5", label: "ALTO" },
  { range: "4.6-5.0", label: "CRITICO" }
];

export const REPORT_TEMPLATE_VERSION: ReportTemplateVersion = "v1";

export function renderIndividualReportHtml(data: IndividualReportData) {
  const body = `
    <p class="eyebrow">Relatorio Individual</p>
    <h1>${data.campaign.name}</h1>
    <p class="muted">Questionario ${data.questionnaire.name} · versao ${data.questionnaire.version}</p>
    <div class="grid grid-2" style="margin-top:24px;">
      <div class="card"><strong>Data/Hora</strong><p>${data.submission.submittedAt}</p></div>
      <div class="card"><strong>ID do envio</strong><p>${data.submission.receiptCode}</p></div>
    </div>
    ${data.sections.map((section) => `
      <h2>${section.name}</h2>
      <p><span class="badge">${section.label}</span> Media da secao: <strong>${section.average}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Pergunta</th>
            <th>Resposta</th>
            <th>Risco</th>
          </tr>
        </thead>
        <tbody>
          ${section.items.map((item) => `
            <tr>
              <td>${item.prompt}</td>
              <td>${item.answerRaw}</td>
              <td><span class="badge ${item.isCritical ? "critical" : ""}">${item.riskValue}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `).join("")}
    ${data.submission.observationText ? `<h2>Observacoes</h2><p>${data.submission.observationText}</p>` : ""}
    <p class="footer">Template versionado: ${REPORT_TEMPLATE_VERSION}. Geracao server-side e estrutura auditavel.</p>
  `;

  return reportDocument(`Relatorio Individual - ${data.campaign.name}`, body);
}

export function renderAnalyticalReportHtml(data: AnalyticalReportData) {
  const body = `
    <p class="eyebrow">Relatorio Analitico</p>
    <h1>${data.campaign.name}</h1>
    <p class="muted">Gerado em ${data.generatedAt}</p>
    <div class="grid grid-2" style="margin-top:24px;">
      <div class="card"><strong>Respostas</strong><p>${data.summary.responseCount}</p></div>
      <div class="card"><strong>Itens criticos</strong><p>${data.summary.criticalItemsCount}</p></div>
    </div>
    <h2>Resumo executivo</h2>
    <p>O consolidado da campanha cobre ${data.summary.sectionCount} secoes avaliadas. A analise abaixo resume classificacao por secao, itens criticos e acoes recomendadas para priorizacao do RH.</p>
    <h2>Tabela por secao</h2>
    <table>
      <thead>
        <tr>
          <th>Secao</th>
          <th>Media</th>
          <th>Classificacao</th>
          <th>Respostas</th>
          <th>Criticos</th>
        </tr>
      </thead>
      <tbody>
        ${data.sectionTable.map((section) => `
          <tr>
            <td>${section.sectionId}</td>
            <td>${section.average}</td>
            <td>${section.label}</td>
            <td>${section.responseCount}</td>
            <td>${section.criticalItemCount}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <h2>Escala de risco</h2>
    <table>
      <thead><tr><th>Faixa</th><th>Classificacao</th></tr></thead>
      <tbody>${SCALE.map((item) => `<tr><td>${item.range}</td><td>${item.label}</td></tr>`).join("")}</tbody>
    </table>
    <h2>Itens criticos</h2>
    <ul>${data.criticalItems.map((item) => `<li>Questao ${item.questionId} · Secao ${item.sectionId} · Risco ${item.riskValue}</li>`).join("") || "<li>Nenhum item critico no recorte atual.</li>"}</ul>
    <h2>Recomendacoes</h2>
    <ul>${data.recommendations.map((item) => `<li>${item}</li>`).join("")}</ul>
    <h2>Plano de acao estruturado</h2>
    <table>
      <thead>
        <tr>
          <th>Risco</th>
          <th>Secao</th>
          <th>Medida</th>
          <th>Responsavel</th>
          <th>Prazo</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.actionPlan.map((item) => `
          <tr>
            <td>${item.riskIdentified}</td>
            <td>${item.sectionName ?? "-"}</td>
            <td>${item.measure}</td>
            <td>${item.ownerName ?? "-"}</td>
            <td>${item.dueDate ?? "-"}</td>
            <td>${item.status}</td>
          </tr>
        `).join("") || '<tr><td colspan="6">Nenhuma acao registrada.</td></tr>'}
      </tbody>
    </table>
    <p class="footer">Template versionado: ${REPORT_TEMPLATE_VERSION}. Estrutura auditavel, consistente e gerada a partir de snapshot fechado.</p>
  `;

  return reportDocument(`Relatorio Analitico - ${data.campaign.name}`, body);
}
