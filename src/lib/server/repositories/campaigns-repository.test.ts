import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();
const createAdminSupabaseClient = vi.fn(() => ({ from }));

vi.mock("@/lib/server/supabase/admin", () => ({
  createAdminSupabaseClient,
}));

describe("campaigns repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createAdminSupabaseClient.mockReturnValue({ from });
  });

  it("creates new campaigns as active by default", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "c-1", name: "Campanha Teste", status: "active" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    from.mockReturnValue({ insert });

    const { createCampaign } = await import("./campaigns-repository");
    const campaign = await createCampaign({
      name: "Campanha Teste",
      questionnaire_id: "q-1",
      start_date: "2026-04-10",
      end_date: "2026-04-30",
      sector: "Costura",
      unit: "Setor A",
    });

    expect(from).toHaveBeenCalledWith("campaigns");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Campanha Teste",
        questionnaire_id: "q-1",
        status: "active",
        language: "pt-BR",
      }),
    );
    expect(campaign.status).toBe("active");
  });

  it("includes questionnaire metadata in campaign listings", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const select = vi.fn(() => ({ order }));

    from.mockReturnValue({ select });

    const { listCampaigns } = await import("./campaigns-repository");
    await listCampaigns();

    expect(from).toHaveBeenCalledWith("campaigns");
    expect(select).toHaveBeenCalledWith(
      expect.stringContaining("questionnaire_id"),
    );
    expect(select).toHaveBeenCalledWith(
      expect.stringContaining("questionnaires"),
    );
  });
});
