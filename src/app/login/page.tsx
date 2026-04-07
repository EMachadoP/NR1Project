import { signInAction } from "@/lib/server/services/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen bg-canvas">
      {/* Left panel — brand */}
      <div className="hidden flex-col justify-between bg-sidebar p-12 lg:flex lg:w-[45%]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-base font-semibold text-white">NR-1 Risk Manager</span>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Plataforma Profissional</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Gestão de risco<br />psicossocial com<br />rastreabilidade total.
          </h2>
          <p className="mt-6 text-base leading-7 text-slate-400">
            Campanhas anônimas, cálculo automático de risco, relatórios auditáveis e planos de ação integrados ao fluxo de RH e Segurança do Trabalho.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { label: "Anonimato por design", desc: "Respostas sem identificadores pessoais" },
              { label: "Cálculo oficial no backend", desc: "Consistência garantida por regras centralizadas" },
              { label: "Integração com IA", desc: "Recomendações estruturadas com guardrails" }
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">NR-1 Survey & Risk Manager · Portal RH / Admin</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-ink">NR-1 Risk Manager</span>
          </div>

          <h1 className="text-2xl font-semibold text-ink">Acesso ao portal</h1>
          <p className="mt-1.5 text-sm text-muted">RH, Segurança do Trabalho e Administradores.</p>

          <form action={signInAction} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder-muted outline-none ring-0 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                name="email"
                placeholder="voce@empresa.com"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Senha
                </label>
                <a href="/login/forgot-password" className="text-xs font-medium text-accent hover:underline">
                  Esqueci a senha
                </a>
              </div>
              <input
                id="password"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                name="password"
                placeholder="••••••••"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            {params.error ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <svg className="mt-0.5 shrink-0 text-danger" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-danger">{params.error}</p>
              </div>
            ) : null}

            <button
              className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
              type="submit"
            >
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            Respondentes acessam via link ou QR code da campanha —{" "}
            <span className="font-medium text-ink-2">não por este portal.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
