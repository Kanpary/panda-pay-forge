
REVOKE EXECUTE ON FUNCTION public.game_place_bet(numeric, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.game_settle_bet(uuid, numeric, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM anon;
