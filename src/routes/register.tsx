import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell, Field, buttonClass, inputClass } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { maskCpf, maskPhone, onlyDigits } from "@/lib/format";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"].slice(0, 40) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Criar conta — PandaPix" },
      { name: "description", content: "Crie sua conta PandaPix em segundos e jogue com depósito via Pix." },
      { property: "og:title", content: "Criar conta — PandaPix" },
      { property: "og:description", content: "Cadastro rápido, depósito via Pix e saque na hora." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().min(10, "Telefone inválido").max(11),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  password: z.string().min(6, "A senha precisa de ao menos 6 caracteres").max(72),
});

function RegisterPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    password: "",
    affiliate_code: ref ?? "",
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      telefone: onlyDigits(form.telefone),
      cpf: onlyDigits(form.cpf),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nome: parsed.data.nome,
          telefone: parsed.data.telefone,
          cpf: parsed.data.cpf,
          affiliate_code: form.affiliate_code.trim() || null,
        },
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      let friendly = "Não foi possível cadastrar. Tente novamente.";
      if (msg.includes("already") || msg.includes("user_already_registered")) {
        friendly = "E-mail já cadastrado. Use outro e-mail ou faça login.";
      } else if (msg.includes("weak_password") || msg.includes("password")) {
        friendly = "Senha muito fraca. Use pelo menos 6 caracteres com letras e números.";
      } else if (msg.includes("email") && msg.includes("invalid")) {
        friendly = "E-mail inválido. Verifique o endereço digitado.";
      } else if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        friendly = "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
      }
      toast.error(friendly);
      return;
    }

    if (!data.session) {
      // Auto-confirm está ativo, mas se a sessão não vier, faz login imediato.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signInError) {
        toast.success("Conta criada! Faça login para continuar.");
        await navigate({ to: "/login", replace: true });
        return;
      }
    }

    toast.success("Conta criada com sucesso!");
    await navigate({ to: "/painel", replace: true });
  }



  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <span className="text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Entrar
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Nome completo">
          <input
            className={inputClass}
            value={form.nome}
            maxLength={80}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Telefone">
          <input
            inputMode="numeric"
            className={inputClass}
            value={maskPhone(form.telefone)}
            onChange={(e) => setForm((f) => ({ ...f, telefone: onlyDigits(e.target.value) }))}
          />
        </Field>
        <Field label="CPF">
          <input
            inputMode="numeric"
            className={inputClass}
            value={maskCpf(form.cpf)}
            onChange={(e) => setForm((f) => ({ ...f, cpf: onlyDigits(e.target.value) }))}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </Field>
        <Field label="Código de indicação (opcional)">
          <input
            className={inputClass}
            value={form.affiliate_code}
            maxLength={40}
            onChange={(e) => setForm((f) => ({ ...f, affiliate_code: e.target.value }))}
          />
        </Field>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </AuthShell>
  );
}
