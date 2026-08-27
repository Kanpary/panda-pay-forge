import { createFileRoute } from "@tanstack/react-router";

import { clientFromRequest, errorResponse, jsonResponse } from "@/lib/game-api.server";

export const Route = createFileRoute("/api/game/balance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await clientFromRequest(request);
        if (!auth) return errorResponse("Não autenticado", 401);

        const { data, error } = await auth.supabase
          .from("profiles")
          .select("saldo, saldo_bonus, saldo_comissao")
          .eq("id", auth.userId)
          .maybeSingle();
        if (error) return errorResponse(error.message);

        return jsonResponse({
          success: true,
          saldo: Number(data?.saldo ?? 0),
          saldo_bonus: Number(data?.saldo_bonus ?? 0),
          saldo_comissao: Number(data?.saldo_comissao ?? 0),
        });
      },
    },
  },
});
