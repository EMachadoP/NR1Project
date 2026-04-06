"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/server/supabase/client";
import { updatePasswordSchema } from "@/lib/validation/auth";

type RecoveryState = "loading" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<RecoveryState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrapRecoverySession() {
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      try {
        if (type === "recovery" && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
          }

          window.history.replaceState({}, document.title, window.location.pathname);
          if (mounted) {
            setState("ready");
          }
          return;
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (mounted) {
          setState(session ? "ready" : "invalid");
        }
      } catch (cause) {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : "Nao foi possivel validar o link de recuperacao.");
          setState("invalid");
        }
      }
    }

    bootstrapRecoverySession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados invalidos.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setState("success");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9ff] px-6 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">NR-1 Portal</p>
        <h1 className="mt-3 text-4xl font-semibold text-sky-950">Redefinir senha</h1>

        {state === "loading" ? <p className="mt-4 text-sm text-slate-600">Validando link de recuperacao...</p> : null}

        {state === "invalid" ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? "O link de recuperacao e invalido ou expirou."}</p>
            <a className="inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white" href="/login/forgot-password">
              Solicitar novo link
            </a>
          </div>
        ) : null}

        {state === "ready" ? (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
              type="password"
              value={password}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              required
            />
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <button className="w-full rounded-xl bg-gradient-to-r from-accent to-sky-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
              Atualizar senha
            </button>
          </form>
        ) : null}

        {state === "success" ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Senha atualizada com sucesso.</p>
            <Link className="inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white" href="/login">
              Ir para o login
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
