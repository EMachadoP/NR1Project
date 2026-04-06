import { signInAction } from "@/lib/server/services/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9ff] px-6 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">NR-1 Portal</p>
        <h1 className="mt-3 text-4xl font-semibold text-sky-950">Acesso RH / Admin</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">A autenticacao do portal usa Supabase Auth. O respondente anonimo nao passa por este fluxo.</p>
        <form action={signInAction} className="mt-8 space-y-4">
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" name="email" placeholder="Email" type="email" required />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3" name="password" placeholder="Senha" type="password" required />
          {params.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p> : null}
          <button className="w-full rounded-xl bg-gradient-to-r from-accent to-sky-700 px-4 py-3 text-sm font-semibold text-white" type="submit">Entrar</button>
        </form>
        <div className="mt-5 text-center text-sm text-slate-600">
          <a className="font-semibold text-sky-700 underline decoration-sky-200 underline-offset-4" href="/login/forgot-password">
            Esqueci minha senha
          </a>
        </div>
      </section>
    </main>
  );
}
