import type { Route } from "next";
import { signOutAction } from "@/lib/server/services/auth-actions";
import type { PortalRole, PortalSession } from "@/lib/auth/session";
import { NavLink } from "./nav-link";

const IconCampaigns = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconActionPlan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const IconIndicators = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

const IconQuestionnaires = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

const links: Array<{ href: Route; label: string; icon: React.ReactNode; visibleFor?: PortalRole[] }> = [
  { href: "/campanhas", label: "Campanhas", icon: <IconCampaigns /> },
  { href: "/plano-de-acao", label: "Plano de ação", icon: <IconActionPlan /> },
  { href: "/indicadores", label: "Indicadores", icon: <IconIndicators /> },
  { href: "/questionarios", label: "Questionários", icon: <IconQuestionnaires />, visibleFor: ["admin", "hr"] },
  { href: "/admin/questionarios" as Route, label: "Gerir Questionários", icon: <IconQuestionnaires />, visibleFor: ["admin"] }
];

const roleLabels: Record<PortalRole, string> = {
  admin: "Administrador",
  hr: "RH / Segurança",
  manager: "Gestor"
};

type PortalShellProps = {
  session: PortalSession;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function PortalShell({ session, eyebrow, title, description, action, children }: PortalShellProps) {
  const visibleLinks = links.filter((link) => !link.visibleFor || link.visibleFor.includes(session.role));
  const initials = (session.displayName ?? session.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">NR-1</p>
            <p className="text-sm font-semibold text-white leading-tight">Risk Manager</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-slate-800" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} />
          ))}
        </nav>

        {/* User card */}
        <div className="mx-3 mb-4 rounded-xl bg-slate-800/60 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{session.displayName ?? session.email ?? "Usuário"}</p>
              <p className="text-xs text-slate-400">{roleLabels[session.role] ?? session.role}</p>
            </div>
          </div>
          <form action={signOutAction} className="mt-3">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-700 hover:text-white"
              type="submit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile brand + page title) */}
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:px-8">
          <div>
            {eyebrow && (
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
            )}
            <h1 className="text-xl font-semibold text-ink">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>

        {/* Content */}
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

