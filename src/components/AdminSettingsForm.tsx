import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminCard, smallBtn } from "@/components/AdminShell";
import { Field, inputClass } from "@/components/AuthShell";
import { getAdminSettings } from "@/lib/admin-lists.functions";
import { saveAppSetting } from "@/lib/admin.functions";

export type SettingField = {
  name: string;
  label: string;
  type: "text" | "number" | "boolean";
  hint?: string;
};

type SettingKey = "gateway" | "aparencia" | "pixel" | "afiliados" | "bonus";
type SettingValue = string | number | boolean;

export function AdminSettingsForm({
  settingKey,
  title,
  fields,
}: {
  settingKey: SettingKey;
  title: string;
  fields: SettingField[];
}) {
  const queryClient = useQueryClient();
  const loadSettings = useServerFn(getAdminSettings);
  const saveSetting = useServerFn(saveAppSetting);
  const [form, setForm] = useState<Record<string, SettingValue>>({});

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => loadSettings(),
  });

  useEffect(() => {
    const current = settingsQuery.data?.settings?.[settingKey];
    if (!current) return;
    const next: Record<string, SettingValue> = {};
    for (const field of fields) {
      const raw = current[field.name];
      next[field.name] =
        field.type === "boolean"
          ? Boolean(raw ?? false)
          : field.type === "number"
            ? Number(raw ?? 0)
            : String(raw ?? "");
    }
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQuery.data, settingKey]);

  const mutation = useMutation({
    mutationFn: () => saveSetting({ data: { key: settingKey, value: form } }),
    onSuccess: async () => {
      toast.success("Configurações salvas.");
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminCard title={title}>
      {settingsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          {fields.map((field) =>
            field.type === "boolean" ? (
              <label key={field.name} className="flex items-center gap-2 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={Boolean(form[field.name])}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.checked }))
                  }
                />
                {field.label}
              </label>
            ) : (
              <Field key={field.name} label={field.label} hint={field.hint}>
                <input
                  className={inputClass}
                  type={field.type === "number" ? "number" : "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  value={String(form[field.name] ?? "")}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      [field.name]:
                        field.type === "number" ? Number(event.target.value) : event.target.value,
                    }))
                  }
                />
              </Field>
            ),
          )}
          <div className="sm:col-span-2">
            <button type="submit" className={smallBtn} disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </AdminCard>
  );
}
