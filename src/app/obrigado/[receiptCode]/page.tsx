import { notFound } from "next/navigation";
import { getReceiptTtlDays, isReceiptExpired } from "@/lib/domain/receipts/policy";
import { getPublicReceipt } from "@/lib/server/services/report-service";

export default async function ThankYouPage({ params }: { params: Promise<{ receiptCode: string }> }) {
  const { receiptCode } = await params;
  const receipt = await getPublicReceipt(receiptCode);

  if (!receipt || isReceiptExpired(receipt.receiptExpiresAt)) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-10">
      <section className="rounded-[28px] bg-white p-8 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Envio concluido</p>
        <h1 className="mt-4 text-4xl font-semibold text-sky-950">Resposta anonima registrada</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          O comprovante publico foi registrado com o codigo <strong>{receipt.receiptCode}</strong>. O calculo oficial foi executado no backend e o recibo fica disponivel por {getReceiptTtlDays()} dias.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Campanha</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.campaignName}</p>
            <p className="mt-2 text-sm text-slate-600">Questionario: {receipt.questionnaireName}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Relatorio individual</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.reportStatus === "done" ? "Gerado" : receipt.reportStatus === "failed" ? "Falhou" : "Pendente"}</p>
            <p className="mt-2 text-sm text-slate-600">Expira em: {new Date(receipt.receiptExpiresAt).toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
