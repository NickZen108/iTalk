begin;
select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','64000000-0000-0000-0000-000000000001','authenticated','authenticated','owner-rights@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','64000000-0000-0000-0000-000000000002','authenticated','authenticated','teacher-rights@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','64000000-0000-0000-0000-000000000003','authenticated','authenticated','outsider-rights@example.test','',now(),now(),now());
insert into public.schools (id,name,created_by) values
  ('b9000000-0000-0000-0000-000000000001','Rettighedsskole','64000000-0000-0000-0000-000000000001'),
  ('b9000000-0000-0000-0000-000000000002','Anden rettighedsskole','64000000-0000-0000-0000-000000000003');
insert into public.school_members (school_id,user_id,role,display_name) values
  ('b9000000-0000-0000-0000-000000000001','64000000-0000-0000-0000-000000000001','owner','Owner'),
  ('b9000000-0000-0000-0000-000000000001','64000000-0000-0000-0000-000000000002','teacher','Lærer'),
  ('b9000000-0000-0000-0000-000000000002','64000000-0000-0000-0000-000000000003','owner','Outsider');
insert into public.students (
  id,school_id,local_reference_hash,display_name,birth_year,active,
  approval_status,approved_at,approved_by,created_by
) values (
  'b9100000-0000-0000-0000-000000000001',
  'b9000000-0000-0000-0000-000000000001',
  repeat('9',64),'Forkert navn',2014,true,'approved',now(),
  '64000000-0000-0000-0000-000000000002',
  '64000000-0000-0000-0000-000000000002'
);
insert into public.student_activities (
  school_id,student_id,activity_type,occurred_at,duration_seconds,created_by
) values (
  'b9000000-0000-0000-0000-000000000001',
  'b9100000-0000-0000-0000-000000000001',
  'conversation_completed',now() - interval '400 days',120,
  '64000000-0000-0000-0000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.aal','aal1',true);
select set_config('request.jwt.claim.sub','64000000-0000-0000-0000-000000000002',true);

select lives_ok(
  $$select public.rectify_school_student('b9100000-0000-0000-0000-000000000001','Korrekt navn')$$,
  'teacher can rectify a pupil in the same school'
);
select is(
  (public.export_school_student_data('b9100000-0000-0000-0000-000000000001')->'student'->>'display_name'),
  'Korrekt navn',
  'export contains the rectified display name'
);
select is(
  jsonb_array_length(public.export_school_student_data('b9100000-0000-0000-0000-000000000001')->'activities'),
  1,
  'export contains the pupil activity'
);
select is(
  (select count(*)::integer from public.list_student_audit_events('b9100000-0000-0000-0000-000000000001',20)
    where action = 'student_rectified'),
  1,
  'rectification is audited without storing the old pupil name'
);

select set_config('request.jwt.claim.sub','64000000-0000-0000-0000-000000000003',true);
select throws_ok(
  $$select public.export_school_student_data('b9100000-0000-0000-0000-000000000001')$$,
  'P0001','Eleven blev ikke fundet på din skole',
  'another school cannot export the pupil'
);
select throws_ok(
  $$select public.rectify_school_student('b9100000-0000-0000-0000-000000000001','Lækket navn')$$,
  'P0001','Eleven blev ikke fundet på din skole',
  'another school cannot rectify the pupil'
);

select set_config('request.jwt.claim.sub','64000000-0000-0000-0000-000000000001',true);
select throws_ok(
  $$select public.set_school_retention_days('b9000000-0000-0000-0000-000000000001',365)$$,
  'P0001','AAL2-bekræftet skoleadministrator kræves',
  'AAL1 owner cannot change retention'
);
select set_config('request.jwt.claim.aal','aal2',true);
select is(
  public.set_school_retention_days('b9000000-0000-0000-0000-000000000001',365),
  365,
  'AAL2 owner can set retention'
);
select is(
  (public.purge_school_expired_data('b9000000-0000-0000-0000-000000000001')->>'student_activities')::integer,
  1,
  'manual purge deletes the expired activity'
);
select is(
  (select count(*)::integer from public.student_activities
    where student_id = 'b9100000-0000-0000-0000-000000000001'),
  0,
  'expired activity is gone after purge'
);

select * from finish();
rollback;
