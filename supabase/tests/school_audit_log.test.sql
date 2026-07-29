begin;
select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000001','authenticated','authenticated','owner-a@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000002','authenticated','authenticated','admin-a@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000003','authenticated','authenticated','teacher-a@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000004','authenticated','authenticated','owner-b@example.test','',now(),now(),now());

insert into public.schools (id, name, created_by) values
  ('b7000000-0000-0000-0000-000000000001','Skole A','62000000-0000-0000-0000-000000000001'),
  ('b7000000-0000-0000-0000-000000000002','Skole B','62000000-0000-0000-0000-000000000004');
insert into public.school_members (school_id,user_id,role,display_name) values
  ('b7000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000001','owner','Owner A'),
  ('b7000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000002','admin','Admin A'),
  ('b7000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000003','teacher','Teacher A'),
  ('b7000000-0000-0000-0000-000000000002','62000000-0000-0000-0000-000000000004','owner','Owner B');

insert into public.student_audit_events
  (school_id,subject_student_id,action,actor_id,actor_name,occurred_at)
values
  ('b7000000-0000-0000-0000-000000000001','b7100000-0000-0000-0000-000000000001','device_removed','62000000-0000-0000-0000-000000000003','Teacher A','2026-07-28 10:00:00+00'),
  ('b7000000-0000-0000-0000-000000000001','b7100000-0000-0000-0000-000000000002','student_deactivated','62000000-0000-0000-0000-000000000002','Admin A','2026-07-29 10:00:00+00'),
  ('b7000000-0000-0000-0000-000000000002','b7100000-0000-0000-0000-000000000003','student_deleted','62000000-0000-0000-0000-000000000004','Owner B','2026-07-29 11:00:00+00');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','62000000-0000-0000-0000-000000000001',true);
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001')),2,'owner sees own school events');
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000002')),0,'owner cannot see another school');
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001',500,null,null,'62000000-0000-0000-0000-000000000002')),1,'actor filter works');
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001',500,'2026-07-29 00:00:00+00','2026-07-30 00:00:00+00')),1,'date range works');
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001',500,null,null,null,'b7100000-0000-0000-0000-000000000001')),1,'student filter works');
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001',500,null,null,null,null,'student_deactivated')),1,'action filter works');
select is((select subject_student_id from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001') limit 1),'b7100000-0000-0000-0000-000000000002'::uuid,'events are newest first');

select set_config('request.jwt.claim.sub','62000000-0000-0000-0000-000000000002',true);
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001')),2,'admin sees own school events');
select set_config('request.jwt.claim.sub','62000000-0000-0000-0000-000000000003',true);
select is((select count(*)::int from public.list_school_audit_events('b7000000-0000-0000-0000-000000000001')),0,'teacher cannot see school-wide audit');
select throws_ok(
  $$insert into public.student_audit_events (school_id,subject_student_id,action,actor_name) values ('b7000000-0000-0000-0000-000000000001','b7100000-0000-0000-0000-000000000004','device_removed','Fake')$$,
  '42501',
  null,
  'authenticated users cannot forge audit events'
);

select * from finish();
rollback;
