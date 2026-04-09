import { describe, expect, it } from "vitest";
import { getBuildMode } from "@/lib/deploy/build-mode";

describe("build mode", () => {
  it("uses app-only build outside Vercel", () => {
    expect(getBuildMode({ NODE_ENV: "test" })).toEqual({ runRemoteMigrations: false, requireAccessToken: false });
  });

  it("runs remote migrations on Vercel when access token is configured", () => {
    expect(getBuildMode({ NODE_ENV: "test", VERCEL: "1", SUPABASE_ACCESS_TOKEN: "token" })).toEqual({
      runRemoteMigrations: true,
      requireAccessToken: true
    });
  });

  it("fails fast on Vercel when access token is missing", () => {
    expect(getBuildMode({ NODE_ENV: "test", VERCEL: "true" })).toEqual({
      runRemoteMigrations: false,
      requireAccessToken: true
    });
  });
});
