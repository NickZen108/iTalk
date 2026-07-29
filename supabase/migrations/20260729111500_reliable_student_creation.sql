begin;

create or replace function public.ensure_school_student(
  local_reference_hash text,
  student_birth_year integer default null
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_school_id uuid;
  ensured_student public.students;
begin
  if local_reference_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Ugyldig elevreference';
  end if;

  if student_birth_year is not null
    and (student_birth_year < 1926 or student_birth_year > extract(year from now())::integer)
  then
    raise exception 'Ugyldigt fødselsår';
  end if;

  select school_id
  into member_school_id
  from public.school_members
  where user_id = (select auth.uid())
  limit 1;

  if member_school_id is null then
    raise exception 'Medarbejderen er ikke knyttet til en skole';
  end if;

  insert into public.students (
    school_id,
    local_reference_hash,
    birth_year,
    created_by
  )
  values (
    member_school_id,
    local_reference_hash,
    student_birth_year,
    (select auth.uid())
  )
  on conflict (school_id, local_reference_hash)
  do update set
    birth_year = coalesce(excluded.birth_year, public.students.birth_year),
    updated_at = now()
  returning * into ensured_student;

  return ensured_student;
end;
$$;

revoke all on function public.ensure_school_student(text, integer) from public, anon;
grant execute on function public.ensure_school_student(text, integer) to authenticated;

commit;
