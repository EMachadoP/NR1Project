import { describe, expect, it } from "vitest";

type CampaignRecord = {
  id: string;
  name: string;
  status: string;
  questionnaire_id: string;
  sector?: string | null;
  unit?: string | null;
  start_date?: string;
  end_date?: string;
  language?: string;
};

type CampaignSyncPlanModule = {
  buildCampaignSyncPlan: (input: {
    questionnaireId: string;
    existingCampaigns: CampaignRecord[];
    defaultCampaign: CampaignRecord;
  }) => {
    campaignsToPreserve: string[];
    shouldCreateDefaultCampaign: boolean;
    defaultCampaign: CampaignRecord;
  };
};

describe("campaign sync plan", () => {
  it("preserves existing campaigns already linked to the questionnaire", async () => {
    const { buildCampaignSyncPlan } = require("../../../scripts/lib/campaign-sync-plan.js") as CampaignSyncPlanModule;

    const plan = buildCampaignSyncPlan({
      questionnaireId: "q-1",
      existingCampaigns: [
        {
          id: "c-existing",
          name: "Campanha existente",
          status: "draft",
          questionnaire_id: "q-1",
        },
      ] satisfies CampaignRecord[],
      defaultCampaign: {
        id: "c-default",
        name: "Campanha base",
        status: "active",
        questionnaire_id: "q-1",
        sector: "Producao",
        unit: "Costura",
        start_date: "2026-04-01",
        end_date: "2026-12-31",
        language: "pt-BR",
      },
    });

    expect(plan.shouldCreateDefaultCampaign).toBe(false);
    expect(plan.campaignsToPreserve).toEqual(["c-existing"]);
  });

  it("creates the default campaign only when there is no campaign for the questionnaire", async () => {
    const { buildCampaignSyncPlan } = require("../../../scripts/lib/campaign-sync-plan.js") as CampaignSyncPlanModule;

    const plan = buildCampaignSyncPlan({
      questionnaireId: "q-1",
      existingCampaigns: [],
      defaultCampaign: {
        id: "c-default",
        name: "Campanha base",
        status: "active",
        questionnaire_id: "q-1",
        sector: "Producao",
        unit: "Costura",
        start_date: "2026-04-01",
        end_date: "2026-12-31",
        language: "pt-BR",
      },
    });

    expect(plan.shouldCreateDefaultCampaign).toBe(true);
    expect(plan.defaultCampaign).toMatchObject({
      id: "c-default",
      questionnaire_id: "q-1",
    });
  });
});
