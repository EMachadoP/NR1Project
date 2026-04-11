const { execSync } = require("node:child_process");

const isVercel = ["1", "true"].includes((process.env.VERCEL ?? "").toLowerCase());
const hasSupabaseAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);

if (isVercel && !hasSupabaseAccessToken) {
  throw new Error(
    "SUPABASE_ACCESS_TOKEN is required for Vercel builds before running Supabase migrations."
  );
}

if (isVercel && hasSupabaseAccessToken) {
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "xyhevjwbiczalwpwbfil";
  execSync(`npx supabase db push --project-ref ${projectRef} --yes`, {
    stdio: "inherit",
    shell: true
  });
}

execSync("npx next build", {
  stdio: "inherit",
  shell: true
});
