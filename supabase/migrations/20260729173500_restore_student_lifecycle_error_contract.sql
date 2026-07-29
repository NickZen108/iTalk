begin;

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

commit;
