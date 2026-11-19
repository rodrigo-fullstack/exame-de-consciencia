alter table public.igrejas
  add column street text check (char_length(street) <= 120 and street ~ '[^[:space:]]'),
  add column neighborhood text check (char_length(neighborhood) <= 70 and neighborhood ~ '[^[:space:]]'),
  add column street_number text check (char_length(street_number) <= 20 and street_number ~ '[^[:space:]]'),
  add column city_uf text check (char_length(city_uf) <= 80 and city_uf ~ '^[^/]+/[A-Z]{2}$');

-- Preserve free-form addresses and extract fields only from recognizable formats.
with parsed as (
  select id, regexp_match(
    btrim(address),
    '^([^,]+),[[:space:]]*(?:n[º°o.]?[[:space:]]*)?([0-9]+[[:alnum:]-]*|s/n)(?:,[[:space:]]*([^,]+),[[:space:]]*([^,/]+)[[:space:]]*/[[:space:]]*([a-z]{2}))?$',
    'i'
  ) as parts
  from public.igrejas
)
update public.igrejas as church
set street = btrim(parsed.parts[1]),
    street_number = btrim(parsed.parts[2]),
    neighborhood = btrim(parsed.parts[3]),
    city_uf = btrim(parsed.parts[4]) || '/' || upper(parsed.parts[5])
from parsed
where church.id = parsed.id
  and nullif(btrim(parsed.parts[1]), '') is not null
  and char_length(btrim(parsed.parts[1])) <= 120
  and char_length(btrim(parsed.parts[2])) <= 20
  and (parsed.parts[3] is null or (
    char_length(btrim(parsed.parts[3])) between 1 and 70
    and char_length(btrim(parsed.parts[4])) between 1 and 77
  ));

-- The archdiocese identifies this address as Bonfim, Salvador.
-- https://arquidiocesesalvador.org.br/confira-os-dias-e-os-horarios-da-confissao-no-santuario-santa-dulce-dos-pobres/
update public.igrejas
set neighborhood = 'Bonfim',
    city_uf = 'Salvador/BA',
    address = concat_ws(', ', street, street_number, 'Bonfim', 'Salvador/BA')
where lower(name) = 'santuário santa dulce dos pobres'
  and lower(street) = 'avenida dendezeiros do bonfim'
  and street_number = '161'
  and neighborhood is null
  and city_uf is null;

grant insert (street, neighborhood, street_number, city_uf)
  on table public.igrejas to anon, authenticated;
