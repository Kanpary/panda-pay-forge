import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell, Field, buttonClass, inputClass } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — PandaPix" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta PandaPix." },
      { property: "og:title", content: "Nova senha — PandaPix" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("A nova senha precisa de ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Link expirado. Solicite a recuperação novamente.");
      return;
    }
    toast.success("Senha atualizada!");
    await navigate({ to: "/painel", replace: true });
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Escolha uma senha com pelo menos 8 caracteres."
      footer={
        <Link to="/forgot-password" className="text-muted-foreground">
          Link expirado? Solicite outro
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nova senha">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirmar senha">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthShell>
  );
}
