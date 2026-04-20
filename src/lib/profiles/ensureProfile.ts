type ProfileRow = {
  display_name: string;
  id: string;
};

type QueryError = {
  code?: string;
  message: string;
};

type EnsureProfileClient = {
  from: (table: "profiles") => {
    insert: (payload: ProfileRow) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: ProfileRow | null;
          error: QueryError | null;
        }>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: ProfileRow | null;
          error: QueryError | null;
        }>;
      };
    };
  };
};

type AuthenticatedUser = {
  email?: string | null;
  id: string;
};

export function deriveDisplayName(email?: string | null) {
  if (!email) {
    return "Unnamed Vampire";
  }

  const [localPart] = email.split("@");
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  return cleaned ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) : email;
}

async function loadProfile(
  supabase: EnsureProfileClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Your profile could not be loaded yet.");
  }

  return data;
}

export async function ensureProfile(
  supabase: EnsureProfileClient,
  user: AuthenticatedUser,
) {
  const existingProfile = await loadProfile(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    display_name: deriveDisplayName(user.email),
    id: user.id,
  };
  const { data, error } = await supabase
    .from("profiles")
    .insert(payload)
    .select("id, display_name")
    .single();

  if (!error) {
    return data ?? payload;
  }

  if (error.code === "23505") {
    const concurrentProfile = await loadProfile(supabase, user.id);

    if (concurrentProfile) {
      return concurrentProfile;
    }
  }

  throw new Error(error.message || "Your profile could not be loaded yet.");
}
