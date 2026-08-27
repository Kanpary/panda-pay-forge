import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { AdminShell, adminNoIndex } from "@/components/AdminShell";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/admin/pixel")({
  head: () => ({
    meta: [
      { title: "Pixel e rastreamento — PandaPix Admin" },
      { name: "description", content: "Configurações de pixel e rastreamento." },
      adminNoIndex,
    ],
  }),
  component: AdminPixel,
});

function AdminPixel() {
  return (
    <AdminShell title="Pixel e rastreamento" description="Configure códigos de rastreamento e conversão.">
      <AdminSettingsForm
        settingKey="pixel"
        title="Rastreamento"
        fields={[
          { name: "facebook_pixel_id", label: "Facebook Pixel ID", type: "text" },
          { name: "google_analytics_id", label: "Google Analytics ID", type: "text" },
          { name: "gtm_id", label: "Google Tag Manager ID", type: "text" },
          { name: "head_script", label: "Script customizado no head", type: "text" },
        ]}
      />
    </AdminShell>
  );
}
