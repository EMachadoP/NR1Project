import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/server/services/auth-actions";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9ff] px-6 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">NR-1 Portal</p>
        <h1 className="mt-3 text-4xl font-semibold text-sky-950">Recuperar senha</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Informe o email do portal. Se a conta existir, enviaremos um link seguro para redefinicao da senha.</p>
        <form action={requestPasswordResetAction} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
            defaultValue={email}
            name="email"
            placeholder="Email"
            type="email"
            required
          />
          {params.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p> : null}
          {params.sent ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Se a conta existir, o link de redefinicao foi enviado para {email || "o email informado"}.
            </p>
          ) : null}
          <button className="w-full rounded-xl bg-gradient-to-r from-accent to-sky-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
            Enviar link
          </button>
        </form>
        <div className="mt-5 text-center text-sm text-slate-600">
          <Link className="font-semibold text-sky-700 underline decoration-sky-200 underline-offset-4" href="/login">
            Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  );
}
