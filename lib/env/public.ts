const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  supabaseStorageRootPath: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ROOT_PATH,
};

export function getPublicEnv() {
  const missing = Object.entries(publicEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing public environment variables: ${missing.join(", ")}`);
  }

  return publicEnv as {
    supabaseUrl: string;
    supabasePublishableKey: string;
    supabaseStorageRootPath: string;
  };
}
