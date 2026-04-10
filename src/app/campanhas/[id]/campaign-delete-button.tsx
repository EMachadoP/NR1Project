"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CampaignDeleteButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir esta campanha? Tokens, respostas e relatórios vinculados serão removidos.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        alert(payload?.error === "NOT_FOUND" ? "Campanha não encontrada." : "Erro ao excluir campanha.");
        return;
      }

      router.push("/campanhas");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Excluindo..." : "Excluir campanha"}
    </button>
  );
}
