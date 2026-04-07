import Link from "next/link";
import type { Route } from "next";

type EmptyPortalStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: Route;
  actionLabel?: string;
};

export function EmptyPortalState({ eyebrow, title, description, actionHref, actionLabel }: EmptyPortalStateProps) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-panel">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-sky-950">{title}</h3>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-accent to-sky-700 px-5 py-3 text-sm font-semibold text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
