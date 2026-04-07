import { describe, expect, it } from "vitest";
import {
  getPublicSubmissionErrorStatus,
  isCampaignQuestionnaireStatusAllowed
} from "@/lib/server/http/errors";

describe("public access rules", () => {
  it("treats invalid or expired anonymous token as forbidden", () => {
    expect(getPublicSubmissionErrorStatus("INVALID_OR_EXPIRED_TOKEN")).toBe(403);
  });

  it("treats unknown public submission errors as server failures", () => {
    expect(getPublicSubmissionErrorStatus("SOMETHING_ELSE")).toBe(500);
  });

  it("allows creating campaigns only with published questionnaires", () => {
    expect(isCampaignQuestionnaireStatusAllowed("published")).toBe(true);
    expect(isCampaignQuestionnaireStatusAllowed("draft")).toBe(false);
    expect(isCampaignQuestionnaireStatusAllowed("archived")).toBe(false);
    expect(isCampaignQuestionnaireStatusAllowed(null)).toBe(false);
  });
});
