import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { AdminShell, adminNoIndex } from "@/components/AdminShell";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/admin/aparencia")({
  head: () => ({
    meta: [
      { title: "Aparência — PandaPix Admin" },
      { name: "description", content: "Personalização de marca, cores e textos." },
      adminNoIndex,
    ],
  }),
  component: AdminAppearance,
});

function AdminAppearance() {
  return (
    <AdminShell title="Aparência" description="Ajuste marca, cores e textos do site.">
      <AdminSettingsForm
        settingKey="aparencia"
        title="Marca e textos"
        fields={[
          { name: "nome", label: "Nome do site", type: "text" },
          { name: "slogan", label: "Slogan", type: "text" },
          { name: "primary_color", label: "Cor primária", type: "text", hint: "Hex, ex: #3B82F6" },
          {
            name: "accent_color",
            label: "Cor de destaque",
            type: "text",
            hint: "Hex, ex: #F59E0B",
          },
          { name: "footer_text", label: "Texto do rodapé", type: "text" },
        ]}
      />
    </AdminShell>
  );
}
