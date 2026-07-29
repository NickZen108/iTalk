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
<<ensure_school_student_fn>>
declare
  member_school_id uuid;
  ensured_student public.students;
begin
  if ensure_school_student_fn.local_reference_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Ugyldig elevreference';
  end if;

  if student_birth_year is not null
    and (student_birth_year < 1926 or student_birth_year > extract(year from now())::integer)
  then
    raise exception 'Ugyldigt fødselsår';
  end if;

  select sm.school_id
  into member_school_id
  from public.school_members as sm
  where sm.user_id = (select auth.uid())
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
    ensure_school_student_fn.local_reference_hash,
    student_birth_year,
    (select auth.uid())
  )
  on conflict on constraint students_school_id_local_reference_hash_key
  do update set
    birth_year = coalesce(excluded.birth_year, public.students.birth_year),
    updated_at = now()
  returning * into ensured_student;

  return ensured_student;
end;
$$;

commit;
