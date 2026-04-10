import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePortalApiSession = vi.fn();
const deleteCampaign = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requirePortalApiSession,
}));

vi.mock("@/lib/server/repositories/campaigns-repository", () => ({
  deleteCampaign,
}));

describe("DELETE /api/admin/campaigns/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes a campaign for admin users", async () => {
    requirePortalApiSession.mockResolvedValue({ role: "admin" });
    deleteCampaign.mockResolvedValue(undefined);

    const { DELETE } = await import("./[id]/route");
    const response = await DELETE(new Request("http://localhost/api/admin/campaigns/c-1"), {
      params: Promise.resolve({ id: "c-1" }),
    });

    expect(requirePortalApiSession).toHaveBeenCalledWith(["admin"]);
    expect(deleteCampaign).toHaveBeenCalledWith("c-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("maps not found deletion errors to 404", async () => {
    requirePortalApiSession.mockResolvedValue({ role: "admin" });
    deleteCampaign.mockRejectedValue(new Error("NOT_FOUND"));

    const { DELETE } = await import("./[id]/route");
    const response = await DELETE(new Request("http://localhost/api/admin/campaigns/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "NOT_FOUND" });
  });
});
