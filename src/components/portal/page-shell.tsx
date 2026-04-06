type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <section className="rounded-xl2 border border-line bg-white/85 p-8 shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </section>
      {children ? <section className="mt-8">{children}</section> : null}
    </main>
  );
}
