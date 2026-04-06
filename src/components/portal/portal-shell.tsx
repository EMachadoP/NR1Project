import Link from "next/link";
import type { Route } from "next";
import { signOutAction } from "@/lib/server/services/auth-actions";
import type { PortalSession } from "@/lib/auth/session";

const links: Array<{ href: Route; label: string }> = [
  { href: "/campanhas", label: "Campanhas" },
  { href: "/plano-de-acao", label: "Plano de acao" },
  { href: "/indicadores", label: "Indicadores" }
];

type PortalShellProps = {
  session: PortalSession;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PortalShell({ session, title, description, children }: PortalShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-50 px-6 py-8 lg:flex">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">NR-1</p>
            <h1 className="mt-2 text-2xl font-semibold text-sky-950">Risk Manager</h1>
          </div>
          <nav className="mt-10 space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-white p-4 shadow-panel">
            <p className="text-sm font-semibold">{session.displayName ?? session.email ?? "Usuario"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{session.role}</p>
            <form action={signOutAction} className="mt-4">
              <button className="text-sm font-semibold text-red-700" type="submit">
                Sair
              </button>
            </form>
          </div>
        </aside>
        <div className="flex-1 px-6 py-8 lg:px-10">
          <header className="rounded-[28px] bg-white px-8 py-8 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Portal RH</p>
            <h2 className="mt-3 text-4xl font-semibold text-sky-950">{title}</h2>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
          </header>
          <section className="mt-8">{children}</section>
        </div>
      </div>
    </main>
  );
}
