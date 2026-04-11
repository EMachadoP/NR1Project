const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const isVercel = ["1", "true"].includes((process.env.VERCEL ?? "").toLowerCase());
const hasSupabaseAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);

if (isVercel && !hasSupabaseAccessToken) {
  throw new Error(
    "SUPABASE_ACCESS_TOKEN is required for Vercel builds before running Supabase migrations."
  );
}

if (isVercel && hasSupabaseAccessToken) {
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "xyhevjwbiczalwpwbfil";

  // supabase db push --linked requires the project ref written by `supabase link`.
  // In CI there is no local link, so we write the file manually.
  const tempDir = path.join(__dirname, "..", "supabase", ".temp");
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, "project-ref"), projectRef, "utf8");

  execSync("npx supabase db push --linked --yes", {
    stdio: "inherit",
    shell: true
  });
}

execSync("npx next build", {
  stdio: "inherit",
  shell: true
});
