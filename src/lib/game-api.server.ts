import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

/**
 * Cria um client Supabase autenticado com o token enviado pelo jogo (mesma origem).
 * Retorna null quando não há token válido.
 */
export async function clientFromRequest(
  request: Request,
): Promise<{ supabase: SupabaseClient<Database>; userId: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}
