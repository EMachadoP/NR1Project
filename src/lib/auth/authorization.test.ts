import { describe, expect, it } from "vitest";
import {
  ADMIN_ENDPOINT_ACCESS_MATRIX,
  assertCampaignScope,
  assertInternalReportAccess,
  assertRole,
  filterCampaignsBySessionScope,
  matchesManagerScope
} from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";

const adminSession: PortalSession = {
  userId: "u-admin",
  email: "admin@example.com",
  role: "admin",
  displayName: "Admin",
  sector: null,
  unit: null
};

const managerSession: PortalSession = {
  userId: "u-manager",
  email: "manager@example.com",
  role: "manager",
  displayName: "Manager",
  sector: "TI",
  unit: "Fortaleza"
};

describe("authorization", () => {
  it("keeps an access matrix for admin endpoints", () => {
    expect(ADMIN_ENDPOINT_ACCESS_MATRIX.length).toBeGreaterThan(10);
    expect(ADMIN_ENDPOINT_ACCESS_MATRIX.find((rule) => rule.path === "/api/admin/reports/[id]/download")?.notes).toContain("Gestor nunca");
  });

  it("allows required roles and blocks forbidden roles", () => {
    expect(() => assertRole(adminSession, ["admin", "hr"])).not.toThrow();
    expect(() => assertRole(managerSession, ["admin", "hr"])).toThrow("FORBIDDEN");
  });

  it("matches manager campaign scope by sector and unit", () => {
    expect(matchesManagerScope(managerSession, { id: "c1", sector: "TI", unit: "Fortaleza" })).toBe(true);
    expect(matchesManagerScope(managerSession, { id: "c2", sector: "RH", unit: "Fortaleza" })).toBe(false);
    expect(matchesManagerScope(managerSession, { id: "c3", sector: "TI", unit: "Recife" })).toBe(false);
  });

  it("filters campaigns for manager scope", () => {
    const campaigns = [
      { id: "c1", sector: "TI", unit: "Fortaleza" },
      { id: "c2", sector: "RH", unit: "Fortaleza" },
      { id: "c3", sector: "TI", unit: "Recife" }
    ];

    expect(filterCampaignsBySessionScope(managerSession, campaigns)).toEqual([{ id: "c1", sector: "TI", unit: "Fortaleza" }]);
    expect(filterCampaignsBySessionScope(adminSession, campaigns)).toHaveLength(3);
  });

  it("blocks manager outside campaign scope", () => {
    expect(() => assertCampaignScope(managerSession, { id: "c2", sector: "RH", unit: "Fortaleza" })).toThrow("FORBIDDEN");
    expect(() => assertCampaignScope(managerSession, { id: "c1", sector: "TI", unit: "Fortaleza" })).not.toThrow();
  });

  it("blocks manager from individual report downloads", () => {
    expect(() => assertInternalReportAccess(managerSession, { report_type: "individual", campaign_id: "c1" })).toThrow("FORBIDDEN");
    expect(() => assertInternalReportAccess(managerSession, { report_type: "campaign_analytical", campaign_id: "c1" })).not.toThrow();
  });
});
