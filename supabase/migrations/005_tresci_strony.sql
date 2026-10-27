-- =====================================================================
--  Migracja 005 — treści strony (porównywarki) w bazie, edycja w CRM.
--  Dotąd treści (ustawienia, kategorie i oferty, kalkulatory, analiza umów,
--  tłumaczenia, SEO) były w pliku data.json i edytowane w admin.html.
--  Teraz: jedna opublikowana wersja w tabeli site_content.
--  • odczyt: każdy (strona publiczna czyta ją bez logowania),
--  • publikacja: tylko Administrator (sesja z 2FA) — funkcja site_publish,
--    każda publikacja trafia do dziennika audytu.
--  Pusta tabela = strona korzysta dalej z data.json.
-- =====================================================================
create table public.site_content(
  id int primary key default 1 check (id=1),
  data jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id)
);
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
create policy r on public.site_content for select to anon, authenticated using (true);

create or replace function public.site_publish(p_data jsonb) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare t timestamptz;
begin
  if not app.is_admin() then raise exception 'Treści strony publikuje tylko Administrator (z 2FA)' using errcode='42501'; end if;
  if coalesce(jsonb_typeof(p_data),'')<>'object' or coalesce(jsonb_typeof(p_data->'site'),'')<>'object'
     or coalesce(jsonb_typeof(p_data->'categories'),'')<>'array' or coalesce(jsonb_typeof(p_data->'calculators'),'')<>'array' then
    raise exception 'Nieprawidłowe dane strony (brak site / categories / calculators)';
  end if;
  if octet_length(p_data::text) > 2000000 then raise exception 'Dane strony są za duże (maks. 2 MB)'; end if;
  if p_data::text ~ 'sb_secret_|service_role' then raise exception 'W danych jest klucz SECRET — nie wolno go publikować na stronie'; end if;
  insert into public.site_content(id,data,published_at,published_by) values(1,p_data #- '{site,adminHash}',now(),auth.uid())
    on conflict(id) do update set data=excluded.data, published_at=excluded.published_at, published_by=excluded.published_by
    returning published_at into t;
  perform app.audit('strona.publikacja','treści strony',
    format('%s kategorii, %s kalkulatorów, %s bajtów', jsonb_array_length(p_data->'categories'), jsonb_array_length(p_data->'calculators'), octet_length(p_data::text)));
  return t;
end $$;
revoke all on function public.site_publish(jsonb) from public, anon;
grant execute on function public.site_publish(jsonb) to authenticated;
