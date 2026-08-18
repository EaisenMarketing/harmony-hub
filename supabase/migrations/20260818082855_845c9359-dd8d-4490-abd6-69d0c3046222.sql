create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('cron_secret', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

create or replace function public.run_email_automations()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.app_settings where key = 'cron_secret';
  if v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://cdqcjrymdljkhkasmfpe.supabase.co/functions/v1/email-automations',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.run_email_automations() from public, anon, authenticated;

select cron.unschedule('acorde-email-automations')
where exists (select 1 from cron.job where jobname = 'acorde-email-automations');

select cron.schedule('acorde-email-automations', '5 * * * *', $$select public.run_email_automations();$$);