import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw redirect({ to: "/login" });
    const email = userData.user.email?.trim().toLowerCase();
    if (email !== "detroit.system@gmail.com") throw redirect({ to: "/painel" });
    return { isAdmin: true };
  },
  component: () => <Outlet />,
});
