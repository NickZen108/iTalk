begin;

alter table public.schools
  add column data_retention_days integer not null default 365
  check (data_retention_days between 30 and 2190);

comment on column public.schools.data_retention_days is
  'School-approved retention period for operational pupil data. Manual purge is required on the Free plan.';

create table public.data_purge_runs (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  purged_before timestamptz not null,
  activities_deleted integer not null check (activities_deleted >= 0),
  access_grants_deleted integer not null check (access_grants_deleted >= 0),
  revoked_devices_deleted integer not null check (revoked_devices_deleted >= 0),
  audit_events_deleted integer not null check (audit_events_deleted >= 0),
  actor_id uuid references auth.users(id) on delete set null,
  executed_at timestamptz not null default now()
);
alter table public.data_purge_runs enable row level security;
revoke all on public.data_purge_runs from public, anon, authenticated;
comment on table public.data_purge_runs is
  'Minimal accountability record for manual retention runs; contains aggregate counts, never pupil identifiers.';

alter table public.student_audit_events
  drop constraint if exists student_audit_events_action_check;
alter table public.student_audit_events
  add constraint student_audit_events_action_check check (action in (
    'device_removed',
    'student_deactivated',
    'student_reactivated',
    'student_rectified',
    'student_deleted'
  ));

create or replace function public.get_school_retention_settings(target_school_id uuid)
returns table (
  retention_days integer,
  purge_before timestamptz,
  expired_activities bigint,
  expired_access_grants bigint,
  expired_revoked_devices bigint,
  expired_audit_events bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.data_retention_days,
    now() - make_interval(days => s.data_retention_days),
    (select count(*) from public.student_activities a
      where a.school_id = s.id
        and a.occurred_at < now() - make_interval(days => s.data_retention_days)),
    (select count(*) from public.student_access_grants g
      where g.school_id = s.id
        and g.expires_at < now() - make_interval(days => s.data_retention_days)),
    (select count(*) from public.student_devices d
      where d.school_id = s.id
        and d.revoked_at < now() - make_interval(days => s.data_retention_days)),
    (select count(*) from public.student_audit_events e
      where e.school_id = s.id
        and e.occurred_at < now() - make_interval(days => s.data_retention_days))
  from public.schools s
  where s.id = target_school_id
    and public.is_school_admin(target_school_id);
$$;

create or replace function public.set_school_retention_days(
  target_school_id uuid,
  requested_days integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if requested_days not between 30 and 2190 then
    raise exception 'Opbevaringsperioden skal være mellem 30 og 2190 dage';
  end if;
  if not public.is_school_admin(target_school_id) then
    raise exception 'AAL2-bekræftet skoleadministrator kræves';
  end if;

  update public.schools
  set data_retention_days = requested_days,
      updated_at = now()
  where id = target_school_id;
  return requested_days;
end;
$$;

create or replace function public.purge_school_expired_data(target_school_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff timestamptz;
  activities_deleted integer := 0;
  grants_deleted integer := 0;
  devices_deleted integer := 0;
  audits_deleted integer := 0;
begin
  if not public.is_school_admin(target_school_id) then
    raise exception 'AAL2-bekræftet skoleadministrator kræves';
  end if;

  select now() - make_interval(days => s.data_retention_days)
  into cutoff
  from public.schools s
  where s.id = target_school_id;

  delete from public.student_activities
  where school_id = target_school_id and occurred_at < cutoff;
  get diagnostics activities_deleted = row_count;

  delete from public.student_access_grants
  where school_id = target_school_id and expires_at < cutoff;
  get diagnostics grants_deleted = row_count;

  delete from public.student_devices
  where school_id = target_school_id and revoked_at < cutoff;
  get diagnostics devices_deleted = row_count;

  delete from public.student_audit_events
  where school_id = target_school_id and occurred_at < cutoff;
  get diagnostics audits_deleted = row_count;

  insert into public.data_purge_runs (
    school_id, purged_before, activities_deleted, access_grants_deleted,
    revoked_devices_deleted, audit_events_deleted, actor_id
  ) values (
    target_school_id, cutoff, activities_deleted, grants_deleted,
    devices_deleted, audits_deleted, (select auth.uid())
  );

  return jsonb_build_object(
    'purged_before', cutoff,
    'student_activities', activities_deleted,
    'access_grants', grants_deleted,
    'revoked_devices', devices_deleted,
    'audit_events', audits_deleted
  );
end;
$$;

create or replace function public.rectify_school_student(
  target_student_id uuid,
  requested_display_name text
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := trim(requested_display_name);
  changed_student public.students;
begin
  if char_length(normalized_name) not between 1 and 80
    or normalized_name ~ '[[:cntrl:]]'
  then
    raise exception 'Elevnavnet skal være 1-80 tegn uden kontroltegn';
  end if;

  update public.students s
  set display_name = normalized_name,
      updated_at = now()
  where s.id = target_student_id
    and public.is_school_member(s.school_id)
  returning * into changed_student;

  if changed_student.id is null then
    raise exception 'Eleven blev ikke fundet på din skole';
  end if;

  insert into public.student_audit_events (
    school_id, subject_student_id, action, actor_id, actor_name
  ) values (
    changed_student.school_id,
    changed_student.id,
    'student_rectified',
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

create or replace function public.export_school_student_data(target_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'exported_at', now(),
    'student', jsonb_build_object(
      'id', s.id,
      'display_name', s.display_name,
      'birth_year', s.birth_year,
      'active', s.active,
      'approval_status', s.approval_status,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'last_activity_at', s.last_activity_at
    ),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'activity_type', a.activity_type,
        'occurred_at', a.occurred_at,
        'duration_seconds', a.duration_seconds
      ) order by a.occurred_at)
      from public.student_activities a
      where a.student_id = s.id
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'created_at', d.created_at,
        'last_used_at', d.last_used_at,
        'revoked_at', d.revoked_at
      ) order by d.created_at)
      from public.student_devices d
      where d.student_id = s.id
    ), '[]'::jsonb),
    'audit_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'action', e.action,
        'actor_name', e.actor_name,
        'occurred_at', e.occurred_at
      ) order by e.occurred_at)
      from public.student_audit_events e
      where e.subject_student_id = s.id and e.school_id = s.school_id
    ), '[]'::jsonb)
  )
  into result
  from public.students s
  where s.id = target_student_id
    and public.is_school_member(s.school_id);

  if result is null then
    raise exception 'Eleven blev ikke fundet på din skole';
  end if;
  return result;
end;
$$;

revoke all on function public.get_school_retention_settings(uuid) from public, anon;
revoke all on function public.set_school_retention_days(uuid, integer) from public, anon;
revoke all on function public.purge_school_expired_data(uuid) from public, anon;
revoke all on function public.rectify_school_student(uuid, text) from public, anon;
revoke all on function public.export_school_student_data(uuid) from public, anon;
grant execute on function public.get_school_retention_settings(uuid) to authenticated;
grant execute on function public.set_school_retention_days(uuid, integer) to authenticated;
grant execute on function public.purge_school_expired_data(uuid) to authenticated;
grant execute on function public.rectify_school_student(uuid, text) to authenticated;
grant execute on function public.export_school_student_data(uuid) to authenticated;

commit;
