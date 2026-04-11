const { execSync } = require("node:child_process");

const isVercel = ["1", "true"].includes((process.env.VERCEL ?? "").toLowerCase());
const hasSupabaseAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);

if (isVercel && !hasSupabaseAccessToken) {
  throw new Error(
    "SUPABASE_ACCESS_TOKEN is required for Vercel builds before running Supabase migrations."
  );
}

if (isVercel && hasSupabaseAccessToken) {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error(
      "SUPABASE_DB_URL is required for Vercel builds. " +
      "Set it to the direct connection string from Supabase dashboard: " +
      "Settings > Database > Connection string (URI)."
    );
  }

  execSync(`npx supabase db push --db-url "${dbUrl}" --yes`, {
    stdio: "inherit",
    shell: true
  });
}

execSync("npx next build", {
  stdio: "inherit",
  shell: true
});
