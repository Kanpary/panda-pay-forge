import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

export async function assertAdmin(context: AdminContext) {
  const { data: userData, error: userError } = await context.supabase.auth.getUser();
  const email = userData.user?.email?.trim().toLowerCase();
  if (userError || email !== "detroit.system@gmail.com") {
    throw new Error("Acesso restrito ao administrador autorizado.");
  }

  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}
