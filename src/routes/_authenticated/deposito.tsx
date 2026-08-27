import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonClass, Field, inputClass } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateTime } from "@/lib/format";
import { createDeposit } from "@/lib/player.functions";

export const Route = createFileRoute("/_authenticated/deposito")({
  head: () => ({
    meta: [
      { title: "Depositar via Pix — PandaPix" },
      { name: "description", content: "Escolha o valor e gere seu depósito Pix no PandaPix." },
      { property: "og:title", content: "Depositar via Pix — PandaPix" },
      { property: "og:description", content: "Depósito rápido para começar a jogar." },
    ],
  }),
  component: DepositoPage,
});

const quick = [20, 30, 50, 100, 200, 500];

function DepositoPage() {
  const [amount, setAmount] = useState(30);
  const queryClient = useQueryClient();
  const createDepositFn = useServerFn(createDeposit);

  const settingsQuery = useQuery({
    queryKey: ["settings", "gateway-public"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "gateway").maybeSingle();
      return (data?.value ?? {}) as Record<string, number>;
    },
  });

  const listQuery = useQuery({
    queryKey: ["my-deposits-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => createDepositFn({ data: { amount } }),
    onSuccess: () => {
      toast.success("Depósito criado! Aguardando confirmação do pagamento.");
      void queryClient.invalidateQueries({ queryKey: ["my-deposits-full"] });
      void queryClient.invalidateQueries({ queryKey: ["my-deposits"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const min = Number(settingsQuery.data?.["deposito_min"] ?? 10);
  const max = Number(settingsQuery.data?.["deposito_max"] ?? 5000);

  return (
    <AppLayout title="Depositar">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-3 gap-2">
          {quick.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(value)}
              className={`rounded-xl border px-2 py-3 text-sm font-bold ${
                amount === value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary text-foreground"
              }`}
            >
              {brl(value)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Field label="Outro valor" hint={`Mínimo ${brl(min)} · máximo ${brl(max)}`}>
            <input
              type="number"
              min={min}
              max={max}
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
        </div>

        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className={`mt-4 ${buttonClass}`}
        >
          {mutation.isPending ? "Gerando..." : `Depositar ${brl(amount)}`}
        </button>

        <p className="mt-3 rounded-xl bg-secondary p-3 text-[11px] text-muted-foreground">
          O QR Code Pix automático entra em operação na integração com o gateway. Enquanto isso, o depósito
          fica pendente e é confirmado pela equipe.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Meus depósitos</h2>
        <div className="mt-3 space-y-2">
          {(listQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum depósito ainda.</p>
          ) : (
            (listQuery.data ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{brl(d.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">{dateTime(d.created_at)}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  );
}
