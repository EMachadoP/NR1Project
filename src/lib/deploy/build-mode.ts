export type BuildMode = {
  runRemoteMigrations: boolean;
  requireAccessToken: boolean;
};

export function getBuildMode(env: NodeJS.ProcessEnv): BuildMode {
  const isVercel = ["1", "true"].includes((env.VERCEL ?? "").toLowerCase());
  const hasSupabaseAccessToken = Boolean(env.SUPABASE_ACCESS_TOKEN);

  if (!isVercel) {
    return {
      runRemoteMigrations: false,
      requireAccessToken: false
    };
  }

  return {
    runRemoteMigrations: hasSupabaseAccessToken,
    requireAccessToken: true
  };
}
