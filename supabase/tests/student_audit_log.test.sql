begin;
select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '61000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'audit-owner@example.test', '',
  now(), now(), now()
);
insert into public.schools (id, name, created_by) values (
  'b6000000-0000-0000-0000-000000000001',
  'Auditskole',
  '61000000-0000-0000-0000-000000000001'
);
insert into public.school_members (school_id, user_id, role, display_name) values (
  'b6000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001',
  'owner',
  'Audit Lærer'
);
insert into public.students (
  id, school_id, local_reference_hash, active, approval_status, approved_at, approved_by, created_by
) values (
  'b6100000-0000-0000-0000-000000000001',
  'b6000000-0000-0000-0000-000000000001',
  repeat('7', 64), true, 'approved', now(),
  '61000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001'
);
insert into public.student_devices (
  id, school_id, student_id, token_hash
) values (
  'b6200000-0000-0000-0000-000000000001',
  'b6000000-0000-0000-0000-000000000001',
  'b6100000-0000-0000-0000-000000000001',
  repeat('8', 64)
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal2', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"61000000-0000-0000-0000-000000000001","aal":"aal2"}',
  true
);

select lives_ok(
  $$select public.revoke_student_device('b6200000-0000-0000-0000-000000000001')$$,
  'device removal succeeds'
);
select is(
  (select action from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'device_removed', 'device removal is audited server-side'
);
select is(
  (select actor_name from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'Audit Lærer', 'audit shows the school member display name'
);
reset role;
update public.school_members
set display_name = 'Nyt Navn'
where school_id = 'b6000000-0000-0000-0000-000000000001'
  and user_id = '61000000-0000-0000-0000-000000000001';
set local role authenticated;
select is(
  (select actor_name from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'Audit Lærer', 'audit keeps the actor name that applied when the event occurred'
);
select lives_ok(
  $$select public.set_student_active('b6100000-0000-0000-0000-000000000001', false)$$,
  'deactivation succeeds'
);
select is(
  (select action from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'student_deactivated', 'deactivation is audited'
);
select lives_ok(
  $$select public.set_student_active('b6100000-0000-0000-0000-000000000001', true)$$,
  'reactivation succeeds'
);
select is(
  (select count(*)::integer from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20)),
  3, 'all lifecycle events are visible'
);
select lives_ok(
  $$select public.delete_student_permanently('b6100000-0000-0000-0000-000000000001')$$,
  'permanent deletion succeeds'
);
select is(
  (select action from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'student_deleted', 'deletion audit survives pupil deletion'
);
select is(
  (select count(*)::integer from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 2)),
  2, 'audit result limit is enforced'
);
select is(
  (select actor_name from public.list_student_audit_events('b6100000-0000-0000-0000-000000000001', 20) limit 1),
  'Nyt Navn', 'later events use the actor name that applied at that time'
);

select * from finish();
rollback;
