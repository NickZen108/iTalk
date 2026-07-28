begin;
select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'teacher-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'teacher-b@example.test', '', now(), now(), now());

insert into public.schools (id, name, created_by) values
  ('c0000000-0000-0000-0000-000000000001', 'Godkendelsesskole A', '31000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'Godkendelsesskole B', '32000000-0000-0000-0000-000000000002');

insert into public.school_members (school_id, user_id, role) values
  ('c0000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'teacher'),
  ('d0000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'teacher');

insert into public.students (
  id, school_id, local_reference_hash, created_by
) values (
  'd1000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000002',
  repeat('d', 64),
  '32000000-0000-0000-0000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.students (
  id, school_id, local_reference_hash, created_by
) values (
  'c1000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  repeat('c', 64),
  '31000000-0000-0000-0000-000000000001'
);

select is(
  (select approval_status from public.students where id = 'c1000000-0000-0000-0000-000000000001'),
  'pending',
  'new pupil starts pending'
);
select is(
  (select active from public.students where id = 'c1000000-0000-0000-0000-000000000001'),
  false,
  'pending pupil is inactive'
);
select throws_ok(
  $$insert into public.student_activities (school_id, student_id, activity_type, created_by)
    values ('c0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'conversation_started', '31000000-0000-0000-0000-000000000001')$$,
  '42501',
  'new row violates row-level security policy for table "student_activities"',
  'pending pupil cannot create billable activity'
);
select lives_ok(
  $$select public.approve_student('c1000000-0000-0000-0000-000000000001')$$,
  'same-school teacher can approve pupil'
);
select is(
  (select approval_status from public.students where id = 'c1000000-0000-0000-0000-000000000001'),
  'approved',
  'approved pupil has approved status'
);
select lives_ok(
  $$insert into public.student_activities (school_id, student_id, activity_type, created_by)
    values ('c0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'conversation_started', '31000000-0000-0000-0000-000000000001')$$,
  'approved pupil can create activity'
);
select throws_ok(
  $$select public.approve_student('d1000000-0000-0000-0000-000000000002')$$,
  'P0001',
  'Pending pupil not found in your school',
  'teacher cannot approve pupil from another school'
);

select * from finish();
rollback;
