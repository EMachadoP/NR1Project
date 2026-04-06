import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
      <section className="rounded-[32px] bg-white p-10 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">NR-1 Survey & Risk Manager</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight text-sky-950">
          MVP integrado com portal RH, fluxo anonimo por token e calculo de risco centralizado no backend.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          O frontend usa as referencias do Stitch, enquanto o backend preserva anonimato por padrao, token single-use e consolidacao oficial no servidor.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/login" className="rounded-xl bg-gradient-to-r from-accent to-sky-700 px-6 py-3 text-sm font-semibold text-white">Entrar no portal</Link>
          <Link href="/campanhas" className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-800">Abrir campanhas</Link>
        </div>
      </section>
    </main>
  );
}
