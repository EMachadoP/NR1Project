import { Fragment } from "react";

const classificationColors: Record<string, string> = {
  Baixo: "bg-emerald-500/85",
  Medio: "bg-yellow-400/90",
  Alto: "bg-orange-500/90",
  Critico: "bg-red-600/90"
};

function classifyCell(nro: number) {
  if (nro >= 15) return "Critico";
  if (nro >= 10) return "Alto";
  if (nro >= 5) return "Medio";
  return "Baixo";
}

export function RiskMatrixPreview({ probability, severity }: { probability: number; severity: number }) {
  const probabilities = [5, 4, 3, 2, 1];
  const severities = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-xl border border-line bg-slate-950 p-4 text-white shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Matriz 5x5</p>
          <p className="mt-1 text-sm font-semibold text-white">NRO = Probabilidade x Severidade</p>
        </div>
        <div className="rounded-lg bg-white/10 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Atual</p>
          <p className="text-lg font-bold">{probability * severity}</p>
        </div>
      </div>

      <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1 text-center text-xs">
        <div className="flex items-end justify-center pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">P</div>
        {severities.map((value) => (
          <div key={value} className="pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            S{value}
          </div>
        ))}

        {probabilities.map((p) => (
          <Fragment key={p}>
            <div className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {p}
            </div>
            {severities.map((s) => {
              const nro = p * s;
              const band = classifyCell(nro);
              const isSelected = p === probability && s === severity;

              return (
                <div
                  key={`${p}-${s}`}
                  className={[
                    "rounded-md px-1 py-2 font-semibold transition",
                    classificationColors[band],
                    isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-[1.02]" : "opacity-80"
                  ].join(" ")}
                >
                  <div>{nro}</div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
