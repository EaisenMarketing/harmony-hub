REVOKE EXECUTE ON FUNCTION public.push_notification(uuid, text, text, text, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.push_notification(uuid, text, text, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_notifications_read(uuid[]) FROM anon;