import { createFileRoute } from "@tanstack/react-router";

import { clientFromRequest, errorResponse, jsonResponse } from "@/lib/game-api.server";

export const Route = createFileRoute("/api/game/config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await clientFromRequest(request);
        if (!auth) return errorResponse("Não autenticado", 401);

        const { data: settings } = await auth.supabase
          .from("game_settings")
          .select("slug, value, user_id");

        const pick = (slug: string, fallback: number) => {
          const personal = settings?.find((s) => s.slug === slug && s.user_id === auth.userId);
          const global = settings?.find((s) => s.slug === slug && !s.user_id);
          return Number(personal?.value ?? global?.value ?? fallback);
        };

        const { data: profile } = await auth.supabase
          .from("profiles")
          .select("saldo, saldo_bonus, nome, bloqueado, is_demo")
          .eq("id", auth.userId)
          .maybeSingle();

        return jsonResponse({
          success: true,
          rtp: pick("rtp", 90),
          aposta_min: pick("aposta_min", 1),
          aposta_max: pick("aposta_max", 500),
          saldo: Number(profile?.saldo ?? 0),
          saldo_bonus: Number(profile?.saldo_bonus ?? 0),
          nome: profile?.nome ?? "",
          bloqueado: Boolean(profile?.bloqueado),
          demo: Boolean(profile?.is_demo),
        });
      },
    },
  },
});
