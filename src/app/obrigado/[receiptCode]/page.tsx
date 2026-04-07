import { notFound } from "next/navigation";
import { getReceiptTtlDays, isReceiptExpired } from "@/lib/domain/receipts/policy";
import { getPublicReceipt } from "@/lib/server/services/report-service";

const reportStatusConfig = {
  done:    { label: "Gerado",   icon: "✓", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  failed:  { label: "Falhou",   icon: "✗", className: "bg-red-50 text-danger ring-1 ring-red-200" },
  pending: { label: "Pendente", icon: "…", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" }
};

export default async function ThankYouPage({ params }: { params: Promise<{ receiptCode: string }> }) {
  const { receiptCode } = await params;
  const receipt = await getPublicReceipt(receiptCode);

  if (!receipt || isReceiptExpired(receipt.receiptExpiresAt)) {
    notFound();
  }

  const reportStatus = reportStatusConfig[receipt.reportStatus as keyof typeof reportStatusConfig]
    ?? reportStatusConfig.pending;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Envio concluído</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Resposta anônima registrada</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Suas respostas foram processadas com anonimato completo. O comprovante fica disponível por{" "}
            <strong className="text-ink">{getReceiptTtlDays()} dias</strong>.
          </p>
        </div>

        {/* Receipt card */}
        <div className="mt-8 rounded-xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Código do comprovante</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reportStatus.className}`}>
              Relatório: {reportStatus.label}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-sm font-semibold text-ink">{receipt.receiptCode}</p>

          <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Campanha</span>
              <span className="font-medium text-ink text-right">{receipt.campaignName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Questionário</span>
              <span className="font-medium text-ink text-right">{receipt.questionnaireName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Expira em</span>
              <span className="font-medium text-ink">{new Date(receipt.receiptExpiresAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Anonymity note */}
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-white p-4">
          <svg className="mt-0.5 shrink-0 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-xs leading-5 text-muted">
            Nenhum identificador pessoal foi registrado. O cálculo oficial de risco foi executado exclusivamente no backend.
          </p>
        </div>
      </div>
    </main>
  );
}
