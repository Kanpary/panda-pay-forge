import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell, Field, buttonClass, inputClass } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — PandaPix" },
      { name: "description", content: "Acesse sua conta PandaPix para jogar, depositar e sacar via Pix." },
      { property: "og:title", content: "Entrar — PandaPix" },
      { property: "og:description", content: "Acesse sua conta PandaPix." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Senha muito curta").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    await navigate({ to: "/painel", replace: true });
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Use seu e-mail e senha."
      footer={
        <span className="text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/register" search={{ ref: undefined }} className="font-semibold text-primary">
            Cadastre-se
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-mail">
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </Field>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <Link to="/forgot-password" className="block text-center text-xs text-muted-foreground">
          Esqueci minha senha
        </Link>
      </form>
    </AuthShell>
  );
}
