begin;

alter table public.students
  add column approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  add column approval_requested_at timestamptz not null default now(),
  add column approved_at timestamptz,
  add column approved_by uuid references auth.users(id);

-- Existing pupils already generated legitimate activity before this workflow existed.
update public.students
set approval_status = 'approved',
    approved_at = coalesce(last_activity_at, created_at),
    approved_by = created_by,
    active = true;

alter table public.students alter column active set default false;

create index students_school_approval_idx
  on public.students (school_id, approval_status, approval_requested_at desc);

create or replace function public.approve_student(target_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_student public.students;
begin
  update public.students
  set approval_status = 'approved',
      active = true,
      approved_at = now(),
      approved_by = (select auth.uid()),
      updated_at = now()
  where id = target_student_id
    and public.is_school_member(school_id)
    and approval_status = 'pending'
  returning * into approved_student;

  if approved_student.id is null then
    raise exception 'Pending pupil not found in your school';
  end if;

  return approved_student;
end;
$$;

revoke all on function public.approve_student(uuid) from public, anon;
grant execute on function public.approve_student(uuid) to authenticated;

drop policy activities_insert_own_school on public.student_activities;
create policy activities_insert_approved_student on public.student_activities
for insert to authenticated with check (
  public.is_school_member(school_id)
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_id
      and s.school_id = school_id
      and s.active
      and s.approval_status = 'approved'
  )
);

commit;
