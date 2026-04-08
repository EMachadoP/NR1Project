const probabilityRows = [
  { score: 1, label: "Quase improvável", description: "Baixa percepção de risco; ambiente controlado." },
  { score: 2, label: "Raro", description: "Indícios pontuais de desconforto ou falhas isoladas." },
  { score: 3, label: "Possível", description: "Presença consistente de fatores de estresse no trabalho." },
  { score: 4, label: "Provável", description: "Fatores já impactando clima, saúde e rotina operacional." },
  { score: 5, label: "Quase certo", description: "Risco psicossocial elevado e disseminado." }
];

const severityRows = [
  { score: 1, label: "Insignificante", description: "Desconforto leve, sem impacto funcional ou afastamento." },
  { score: 2, label: "Menor", description: "Impacto leve e reversível, com tratamento simples." },
  { score: 3, label: "Moderada", description: "Redução de desempenho e possível afastamento temporário." },
  { score: 4, label: "Grave", description: "Quadro incapacitante temporário ou sequela relevante." },
  { score: 5, label: "Catastrófica", description: "Morte ou incapacidade permanente total." }
];

const classificationRows = [
  { range: "1-4", label: "Baixo", action: "Manter controles existentes e revisar periodicamente." },
  { range: "5-9", label: "Medio", action: "Reforçar prevenção e acompanhar evolução do risco." },
  { range: "10-14", label: "Alto", action: "Executar plano preventivo formal e monitoramento próximo." },
  { range: "15-25", label: "Critico", action: "Intervenção imediata com priorização máxima." }
];

export function RiskMatrixCriteria() {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Critérios da Matriz</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">Gradação documentada para a NR-01</h3>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Fórmula</p>
          <p className="text-sm font-semibold text-ink">NRO = Probabilidade x Severidade</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Probabilidade</p>
          <div className="space-y-2">
            {probabilityRows.map((row) => (
              <div key={row.score} className="rounded-lg border border-line bg-slate-50 px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">{row.score}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{row.label}</p>
                    <p className="text-xs text-muted">{row.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Severidade</p>
          <div className="space-y-2">
            {severityRows.map((row) => (
              <div key={row.score} className="rounded-lg border border-line bg-slate-50 px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-danger/10 text-sm font-bold text-danger">{row.score}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{row.label}</p>
                    <p className="text-xs text-muted">{row.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-line">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-muted">
            <tr>
              <th className="px-4 py-3">Faixa</th>
              <th className="px-4 py-3">Classificação</th>
              <th className="px-4 py-3">Prioridade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {classificationRows.map((row) => (
              <tr key={row.range}>
                <td className="px-4 py-3 font-semibold text-ink">{row.range}</td>
                <td className="px-4 py-3 text-ink">{row.label}</td>
                <td className="px-4 py-3 text-muted">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
