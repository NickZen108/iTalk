begin;

alter table public.students
  add column display_name text;

alter table public.students
  add constraint students_display_name_format check (
    display_name is null
    or (
      display_name = trim(display_name)
      and char_length(display_name) between 1 and 80
      and display_name !~ '[[:cntrl:]]'
    )
  );

comment on column public.students.display_name is
  'Elevens visningsnavn. Personoplysning: må kun læses af medarbejdere på samme skole.';

comment on column public.students.local_reference_hash is
  'One-way SHA-256 reference generated on-device. Must never contain the pupil name.';

-- Elevprofiler må kun ændres gennem de validerede RPC-funktioner.
revoke insert, update, delete on public.students from authenticated;

drop function if exists public.ensure_school_student(text, integer);

create function public.ensure_school_student(
  local_reference_hash text,
  student_birth_year integer default null,
  student_display_name text default null
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  ensured_student public.students;
  normalized_name text := nullif(trim(student_display_name), '');
begin
  if local_reference_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Ugyldig elevreference';
  end if;
  if student_birth_year is not null
    and (student_birth_year < 1926 or student_birth_year > extract(year from now())::integer)
  then
    raise exception 'Ugyldigt fødselsår';
  end if;
  if normalized_name is not null
    and (
      char_length(normalized_name) not between 1 and 80
      or normalized_name ~ '[[:cntrl:]]'
    )
  then
    raise exception 'Elevnavnet skal være 1-80 tegn uden kontroltegn';
  end if;

  select sm.school_id into caller_school_id
  from public.school_members sm
  where sm.user_id = (select auth.uid())
  limit 1;

  if caller_school_id is null then
    raise exception 'Brugeren er ikke tilknyttet en skole';
  end if;

  insert into public.students (
    school_id,
    local_reference_hash,
    birth_year,
    display_name,
    active,
    created_by
  ) values (
    caller_school_id,
    local_reference_hash,
    student_birth_year,
    normalized_name,
    false,
    (select auth.uid())
  )
  on conflict on constraint students_school_id_local_reference_hash_key
  do update set
    birth_year = coalesce(excluded.birth_year, public.students.birth_year),
    display_name = coalesce(excluded.display_name, public.students.display_name),
    updated_at = now()
  returning * into ensured_student;

  return ensured_student;
end;
$$;

create or replace function public.list_school_students()
returns table (
  id uuid,
  local_reference_hash text,
  display_name text,
  birth_year smallint,
  active boolean,
  approval_status text,
  approval_requested_at timestamptz,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.local_reference_hash,
    s.display_name,
    s.birth_year,
    s.active,
    s.approval_status::text,
    s.approval_requested_at,
    s.approved_at
  from public.students s
  where public.is_school_member(s.school_id)
  order by s.created_at, s.id;
$$;

create or replace function public.record_staff_student_activity(
  target_student_id uuid,
  requested_activity_type text,
  requested_duration_seconds integer default null
)
returns public.student_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_student public.students;
  recorded_activity public.student_activities;
begin
  if requested_activity_type not in ('conversation_started', 'conversation_completed') then
    raise exception 'Ugyldig aktivitetstype';
  end if;
  if requested_duration_seconds is not null
    and requested_duration_seconds not between 0 and 3600
  then
    raise exception 'Ugyldig varighed';
  end if;

  select s.* into target_student
  from public.students s
  where s.id = target_student_id
    and public.is_school_member(s.school_id);

  if target_student.id is null then
    raise exception 'Eleven findes ikke på medarbejderens skole';
  end if;
  if target_student.approval_status <> 'approved' or not target_student.active then
    raise exception 'Eleven er ikke aktiv og godkendt';
  end if;

  insert into public.student_activities (
    school_id,
    student_id,
    activity_type,
    duration_seconds,
    created_by
  ) values (
    target_student.school_id,
    target_student.id,
    requested_activity_type,
    requested_duration_seconds,
    (select auth.uid())
  )
  returning * into recorded_activity;

  update public.students
  set last_activity_at = recorded_activity.occurred_at,
      updated_at = now()
  where id = target_student.id;

  return recorded_activity;
end;
$$;

revoke all on function public.ensure_school_student(text, integer, text) from public, anon;
grant execute on function public.ensure_school_student(text, integer, text) to authenticated;
revoke all on function public.list_school_students() from public, anon;
grant execute on function public.list_school_students() to authenticated;
revoke all on function public.record_staff_student_activity(uuid, text, integer) from public, anon;
grant execute on function public.record_staff_student_activity(uuid, text, integer) to authenticated;

commit;
