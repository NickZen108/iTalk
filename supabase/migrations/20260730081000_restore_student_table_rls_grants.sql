begin;

-- RLS er fortsat den egentlige skoleafgrænsning. De almindelige tabelrettigheder
-- skal være til stede, så eksisterende RLS-isolation og godkendelsesflow virker.
grant select, insert, update on public.students to authenticated;

commit;
