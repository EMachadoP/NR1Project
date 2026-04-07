"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickPublishButton({ questionnaireId }: { questionnaireId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!confirm("Publicar este questionário? Os questionários publicados anteriormente serão arquivados.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaireId}/publish`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error === "SECTION_EMPTY" ? "Cada seção precisa ter ao menos uma pergunta." :
              data?.error === "QUESTIONNAIRE_EMPTY" ? "Adicione ao menos uma seção antes de publicar." :
              "Erro ao publicar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
    >
      {loading ? "…" : "Publicar"}
    </button>
  );
}

export function QuickDeleteButton({ questionnaireId }: { questionnaireId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este questionário? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaireId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error === "QUESTIONNAIRE_IN_USE" ? "Este questionário está em uso por campanhas e não pode ser excluído." : "Erro ao excluir.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-danger disabled:opacity-60"
    >
      {loading ? "…" : "Excluir"}
    </button>
  );
}
