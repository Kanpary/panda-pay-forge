import { createFileRoute } from "@tanstack/react-router";

import { verifyOnixPaySignature } from "@/lib/onixpay.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/onixpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-onixpay-signature");
        if (!signature || !verifyOnixPaySignature(rawBody, signature)) {
          return new Response("Assinatura inválida", { status: 401 });
        }

        let payload: { transactionType?: string; transactionId?: string; amount?: number; status?: string };
        try {
          payload = JSON.parse(rawBody) as typeof payload;
        } catch {
          return new Response("JSON inválido", { status: 400 });
        }

        if (payload.transactionType !== "RECEIVEPIX" || payload.status !== "PAID" || !payload.transactionId) {
          return new Response("Received", { status: 200 });
        }

        const { error } = await supabaseAdmin.rpc("credit_onixpay_deposit", {
          _transaction_id: payload.transactionId,
          _amount: Number(payload.amount ?? 0),
          _payload: payload,
        });
        if (error) return new Response("Falha ao processar", { status: 500 });
        return new Response("OK", { status: 200 });
      },
    },
  },
});
