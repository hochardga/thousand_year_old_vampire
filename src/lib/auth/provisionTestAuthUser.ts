import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function ensurePreviewTestAuthUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const existingUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        existingUser.id,
        {
          email_confirm: true,
          password,
        },
      );

      if (updateError) {
        throw updateError;
      }

      return;
    }

    page = data.nextPage ?? 0;
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (createError) {
    throw createError;
  }
}
