import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { clientFromRequest, errorResponse, jsonResponse } from "@/lib/game-api.server";

const schema = z.object({
  aposta: z.coerce.number().positive().max(100000),
  demo: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute("/api/game/bet")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await clientFromRequest(request);
        if (!auth) return errorResponse("Não autenticado", 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Requisição inválida");
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) return errorResponse("Aposta inválida");

        const { data: limits, error: limitsError } = await auth.supabase
          .from("player_game_limits")
          .select("rtp, min_bet, max_bet, enabled, daily_bet_limit")
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (limitsError) return errorResponse(limitsError.message, 500);
        if (limits?.enabled === false)
          return errorResponse("Jogo indisponível para este usuário.", 403);
        const minBet = Number(limits?.min_bet ?? 1);
        const maxBet = Number(limits?.max_bet ?? 1000);
        if (parsed.data.aposta < minBet || parsed.data.aposta > maxBet) {
          return errorResponse(
            `A aposta deve estar entre R$ ${minBet.toFixed(2)} e R$ ${maxBet.toFixed(2)}.`,
            422,
          );
        }

        const { data, error } = await auth.supabase.rpc("game_place_bet", {
          _aposta: parsed.data.aposta,
          _is_demo: parsed.data.demo,
        });
        if (error) return errorResponse(error.message);

        const row = Array.isArray(data) ? data[0] : data;
        return jsonResponse({
          success: true,
          session_id: row?.session_id,
          saldo: Number(row?.saldo ?? 0),
          saldo_bonus: Number(row?.saldo_bonus ?? 0),
        });
      },
    },
  },
});
