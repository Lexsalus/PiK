-- =====================================================================
--  Migracja 012 — serwis dotacji (Lexsalus/Grants) zintegrowany z CRM
--  1) Kategoria spraw DOT „Dotacje i granty” — zgłoszenia z serwisu trafiają do Nowych spraw.
--  2) grants_content: opublikowane treści serwisu (źródła finansowania + ustawienia strony),
--     odczyt publiczny (strona czyta je bez logowania), publikacja tylko Administrator
--     (funkcja grants_publish, wpis w audycie). Pusta tabela = strona używa plików z repozytorium.
-- =====================================================================
insert into public.case_categories(code,name,color_hex,sort_order,process_template,has_currency)
values ('DOT','Dotacje i granty','#ff8a5c',8,'std',false) on conflict (code) do nothing;

create table if not exists public.grants_content(
  id int primary key default 1 check (id=1),
  data jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id)
);
alter table public.grants_content enable row level security;
revoke all on public.grants_content from anon, authenticated;
grant select on public.grants_content to anon, authenticated;
drop policy if exists r on public.grants_content;
create policy r on public.grants_content for select to anon, authenticated using (true);

create or replace function public.grants_publish(p_data jsonb) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare t timestamptz;
begin
  if not app.is_admin() then raise exception 'Serwis dotacji publikuje tylko Administrator (z 2FA)' using errcode='42501'; end if;
  if coalesce(jsonb_typeof(p_data->'programy'),'')<>'array' or coalesce(jsonb_typeof(p_data->'settings'),'')<>'object' then
    raise exception 'Nieprawidłowe dane serwisu (brak programy / settings)';
  end if;
  if octet_length(p_data::text) > 1000000 then raise exception 'Dane serwisu są za duże (maks. 1 MB)'; end if;
  if p_data::text ~ 'sb_secret_|service_role|ghp_|github_pat_' then raise exception 'W danych jest klucz lub token — nie wolno go publikować'; end if;
  insert into public.grants_content(id,data,published_at,published_by) values(1,p_data,now(),auth.uid())
    on conflict(id) do update set data=excluded.data, published_at=excluded.published_at, published_by=excluded.published_by
    returning published_at into t;
  perform app.audit('dotacje.publikacja','serwis dotacji',format('%s źródeł finansowania, %s bajtów', jsonb_array_length(p_data->'programy'), octet_length(p_data::text)));
  return t;
end $$;
revoke all on function public.grants_publish(jsonb) from public, anon;
grant execute on function public.grants_publish(jsonb) to authenticated;

select app.audit('system.migracja','012_dotacje','kategoria DOT, treści serwisu dotacji w bazie');
