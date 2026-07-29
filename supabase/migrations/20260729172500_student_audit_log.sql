begin;

create table public.student_audit_events (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_student_id uuid not null,
  action text not null check (action in (
    'device_removed',
    'student_deactivated',
    'student_reactivated',
    'student_deleted'
  )),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  occurred_at timestamptz not null default now()
);

create index student_audit_events_subject_idx
  on public.student_audit_events (school_id, subject_student_id, occurred_at desc);

alter table public.student_audit_events enable row level security;
revoke all on public.student_audit_events from public, anon, authenticated;

create or replace function public.list_student_audit_events(
  target_student_id uuid,
  result_limit integer default 20
)
returns table (
  id bigint,
  action text,
  actor_name text,
  occurred_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id,
    e.action,
    e.actor_name,
    e.occurred_at
  from public.student_audit_events e
  where e.subject_student_id = target_student_id
    and public.is_school_member(e.school_id)
  order by e.occurred_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 100);
$$;

create or replace function public.revoke_student_device(target_device_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_device public.student_devices;
begin
  update public.student_devices d
  set revoked_at = now()
  where d.id = target_device_id
    and d.revoked_at is null
    and public.is_school_member(d.school_id)
  returning * into changed_device;

  if changed_device.id is null then
    raise exception 'Elev-enheden blev ikke fundet på din skole';
  end if;

  insert into public.student_audit_events (
    school_id, subject_student_id, action, actor_id, actor_name
  ) values (
    changed_device.school_id,
    changed_device.student_id,
    'device_removed',
    (select auth.uid()),
    coalesce((
      select nullif(trim(sm.display_name), '')
      from public.school_members sm
      where sm.school_id = changed_device.school_id
        and sm.user_id = (select auth.uid())
    ), 'Medarbejder')
  );
end;
$$;

create or replace function public.set_student_active(
  target_student_id uuid,
  requested_active boolean
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_student public.students;
begin
  update public.students s
  set active = requested_active,
      updated_at = now()
  where s.id = target_student_id
    and s.approval_status = 'approved'
    and s.active is distinct from requested_active
    and public.is_school_member(s.school_id)
  returning * into changed_student;

  if changed_student.id is null then
    raise exception 'Elevstatus er allerede valgt, eller eleven blev ikke fundet på din skole';
  end if;

  if not requested_active then
    update public.student_devices
    set revoked_at = coalesce(revoked_at, now())
    where student_id = target_student_id and revoked_at is null;
    update public.student_access_grants
    set expires_at = least(expires_at, now())
    where student_id = target_student_id
      and redeemed_at is null
      and expires_at > now();
  end if;

  insert into public.student_audit_events (
    school_id, subject_student_id, action, actor_id, actor_name
  ) values (
    changed_student.school_id,
    changed_student.id,
    case when requested_active then 'student_reactivated' else 'student_deactivated' end,
    (select auth.uid()),
    coalesce((
      select nullif(trim(sm.display_name), '')
      from public.school_members sm
      where sm.school_id = changed_student.school_id
        and sm.user_id = (select auth.uid())
    ), 'Medarbejder')
  );
  return changed_student;
end;
$$;

create or replace function public.delete_student_permanently(target_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_school uuid;
begin
  select s.school_id into target_school
  from public.students s
  where s.id = target_student_id;

  if target_school is null or not public.is_school_admin(target_school) then
    raise exception 'Kun en skoleadministrator kan slette eleven permanent';
  end if;

  insert into public.student_audit_events (
    school_id, subject_student_id, action, actor_id, actor_name
  ) values (
    target_school,
    target_student_id,
    'student_deleted',
    (select auth.uid()),
    coalesce((
      select nullif(trim(sm.display_name), '')
      from public.school_members sm
      where sm.school_id = target_school
        and sm.user_id = (select auth.uid())
    ), 'Medarbejder')
  );
  delete from public.students where id = target_student_id;
end;
$$;

revoke all on function public.list_student_audit_events(uuid, integer) from public, anon;
grant execute on function public.list_student_audit_events(uuid, integer) to authenticated;
grant usage, select on sequence public.student_audit_events_id_seq to service_role;

commit;
