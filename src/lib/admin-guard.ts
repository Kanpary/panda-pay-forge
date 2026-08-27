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

  // O e-mail é a identidade administrativa autorizada pelo proprietário do projeto.
  // A validação do usuário autenticado acima impede acesso por clientes anônimos.
  return true;
}
