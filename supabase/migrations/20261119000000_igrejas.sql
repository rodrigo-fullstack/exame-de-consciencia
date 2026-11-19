begin;

create table public.igrejas (
  id integer generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 160 and name ~ '[^[:space:]]'),
  schedule text not null check (char_length(schedule) between 1 and 1000 and schedule ~ '[^[:space:]]'),
  address text not null check (char_length(address) between 1 and 300 and address ~ '[^[:space:]]')
);

create unique index igrejas_nome_endereco_unicos on public.igrejas (
  lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g'))),
  lower(btrim(regexp_replace(address, '[[:space:]]+', ' ', 'g')))
);

alter table public.igrejas enable row level security;
revoke all on table public.igrejas from public, anon, authenticated;
grant select on table public.igrejas to anon, authenticated;
grant insert (name, schedule, address) on table public.igrejas to anon, authenticated;

create policy "Consulta pública de igrejas" on public.igrejas
  for select to anon, authenticated using (true);

create policy "Cadastro público de igrejas" on public.igrejas
  for insert to anon, authenticated with check (true);

commit;
