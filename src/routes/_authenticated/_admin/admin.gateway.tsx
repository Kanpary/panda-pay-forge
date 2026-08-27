import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { AdminShell, adminNoIndex } from "@/components/AdminShell";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/admin/gateway")({
  head: () => ({
    meta: [
      { title: "Gateway de pagamento — PandaPix Admin" },
      { name: "description", content: "Configurações do gateway Pix." },
      adminNoIndex,
    ],
  }),
  component: AdminGateway,
});

function AdminGateway() {
  return (
    <AdminShell
      title="Gateway de pagamento"
      description="Configure as credenciais e comportamento do Pix."
    >
      <AdminSettingsForm
        settingKey="gateway"
        title="Configurações do gateway"
        fields={[
          { name: "client_id", label: "Client ID", type: "text" },
          { name: "client_secret", label: "Client Secret", type: "text" },
          { name: "webhook_secret", label: "Webhook Secret", type: "text" },
          { name: "sandbox", label: "Modo sandbox", type: "boolean" },
        ]}
      />
    </AdminShell>
  );
}
