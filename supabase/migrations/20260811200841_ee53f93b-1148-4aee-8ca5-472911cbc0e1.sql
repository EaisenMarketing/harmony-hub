
REVOKE EXECUTE ON FUNCTION public.active_instrument(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_entitlement(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_instrument(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_use_ai_tool(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_start_trial(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.group_seat_counts(uuid) FROM anon;
