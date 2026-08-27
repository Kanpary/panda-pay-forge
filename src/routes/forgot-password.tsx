import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell, Field, buttonClass, inputClass } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — PandaPix" },
      { name: "description", content: "Receba um link por e-mail para redefinir a senha da sua conta PandaPix." },
      { property: "og:title", content: "Recuperar senha — PandaPix" },
      { property: "og:description", content: "Enviamos um link para você criar uma nova senha." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.string().trim().email().max(255);

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para o seu e-mail."
      footer={
        <Link to="/login" className="font-semibold text-primary">
          Voltar ao login
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Se existir uma conta com esse e-mail, o link de redefinição já está a caminho.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="E-mail">
            <input
              type="email"
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
