begin;

create index if not exists student_audit_events_school_idx
  on public.student_audit_events (school_id, occurred_at desc, id desc);

create or replace function public.list_school_audit_events(
  target_school_id uuid,
  result_limit integer default 500,
  filter_from timestamptz default null,
  filter_to timestamptz default null,
  filter_actor_id uuid default null,
  filter_student_id uuid default null,
  filter_action text default null
)
returns table (
  id bigint,
  subject_student_id uuid,
  action text,
  actor_id uuid,
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
    e.subject_student_id,
    e.action,
    e.actor_id,
    e.actor_name,
    e.occurred_at
  from public.student_audit_events e
  where e.school_id = target_school_id
    and public.is_school_admin(target_school_id)
    and (filter_from is null or e.occurred_at >= filter_from)
    and (filter_to is null or e.occurred_at < filter_to)
    and (filter_actor_id is null or e.actor_id = filter_actor_id)
    and (filter_student_id is null or e.subject_student_id = filter_student_id)
    and (filter_action is null or e.action = filter_action)
  order by e.occurred_at desc, e.id desc
  limit least(greatest(coalesce(result_limit, 500), 1), 2000);
$$;

revoke all on function public.list_school_audit_events(
  uuid, integer, timestamptz, timestamptz, uuid, uuid, text
) from public, anon;
grant execute on function public.list_school_audit_events(
  uuid, integer, timestamptz, timestamptz, uuid, uuid, text
) to authenticated;

commit;
