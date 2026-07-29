begin;

create or replace function public.list_student_devices(target_student_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.created_at, d.last_used_at, d.revoked_at
  from public.student_devices d
  join public.students s on s.id = d.student_id
  where d.student_id = target_student_id
    and public.is_school_member(s.school_id)
  order by d.revoked_at nulls first, d.last_used_at desc;
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
    and public.is_school_member(s.school_id)
  returning * into changed_student;

  if changed_student.id is null then
    raise exception 'Godkendt elev blev ikke fundet på din skole';
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

  delete from public.students where id = target_student_id;
end;
$$;

revoke all on function public.list_student_devices(uuid) from public, anon;
revoke all on function public.set_student_active(uuid, boolean) from public, anon;
revoke all on function public.delete_student_permanently(uuid) from public, anon;
grant execute on function public.list_student_devices(uuid) to authenticated;
grant execute on function public.set_student_active(uuid, boolean) to authenticated;
grant execute on function public.delete_student_permanently(uuid) to authenticated;

commit;
