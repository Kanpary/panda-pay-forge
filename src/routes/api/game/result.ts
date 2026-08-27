import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { clientFromRequest, errorResponse, jsonResponse } from "@/lib/game-api.server";

const schema = z.object({
  session_id: z.string().uuid(),
  ganho: z.coerce.number().min(0).max(1000000),
  resultado: z.string().trim().max(120).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/game/result")({
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
        if (!parsed.success) return errorResponse("Dados da rodada inválidos");

        const { data, error } = await auth.supabase.rpc("game_settle_bet", {
          _session_id: parsed.data.session_id,
          _ganho: parsed.data.ganho,
          _resultado: parsed.data.resultado ?? null,
          _data: (parsed.data.data ?? {}) as never,
        });
        if (error) return errorResponse(error.message);

        const row = Array.isArray(data) ? data[0] : data;
        return jsonResponse({
          success: true,
          ganho: Number(row?.ganho ?? 0),
          saldo: Number(row?.saldo ?? 0),
          saldo_bonus: Number(row?.saldo_bonus ?? 0),
        });
      },
    },
  },
});
