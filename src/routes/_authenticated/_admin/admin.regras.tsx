import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { AdminShell, adminNoIndex } from "@/components/AdminShell";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/admin/regras")({
  head: () => ({
    meta: [
      { title: "Regras de afiliados e bônus — PandaPix Admin" },
      { name: "description", content: "Configuração de comissões e bônus de primeiro depósito." },
      adminNoIndex,
    ],
  }),
  component: AdminRules,
});

function AdminRules() {
  return (
    <AdminShell title="Afiliados e bônus" description="Ajuste comissões CPA/revshare e bônus de boas-vindas.">
      <AdminSettingsForm
        settingKey="afiliados"
        title="Regras de afiliados"
        fields={[
          { name: "cpa", label: "CPA (R$)", type: "number" },
          { name: "deposito_minimo_cpa", label: "Depósito mínimo para CPA (R$)", type: "number" },
          { name: "revshare", label: "Revshare (%)", type: "number" },
        ]}
      />
      <AdminSettingsForm
        settingKey="bonus"
        title="Bônus de primeiro depósito"
        fields={[
          { name: "ativo", label: "Ativar bônus", type: "boolean" },
          { name: "percentual", label: "Percentual do bônus (%)", type: "number" },
        ]}
      />
    </AdminShell>
  );
}
