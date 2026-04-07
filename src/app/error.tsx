"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-danger"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-ink">Algo deu errado</h1>
        <p className="mt-3 text-sm text-muted">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted">Código: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
