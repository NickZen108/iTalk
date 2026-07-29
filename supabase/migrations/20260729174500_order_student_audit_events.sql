begin;

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
  order by e.occurred_at desc, e.id desc
  limit least(greatest(coalesce(result_limit, 20), 1), 100);
$$;

commit;
