begin;
select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '51000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'lifecycle-teacher@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '52000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'lifecycle-admin@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '53000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'lifecycle-outsider@example.test', '', now(), now(), now());
insert into public.schools (id, name, created_by) values
  ('a5000000-0000-0000-0000-000000000001', 'Livscyklusskole', '52000000-0000-0000-0000-000000000002'),
  ('a5000000-0000-0000-0000-000000000002', 'Anden skole', '53000000-0000-0000-0000-000000000003');
insert into public.school_members (school_id, user_id, role) values
  ('a5000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'teacher'),
  ('a5000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000002', 'owner'),
  ('a5000000-0000-0000-0000-000000000002', '53000000-0000-0000-0000-000000000003', 'owner');
insert into public.students (
  id, school_id, local_reference_hash, active, approval_status, approved_at, approved_by, created_by
) values (
  'a5100000-0000-0000-0000-000000000001',
  'a5000000-0000-0000-0000-000000000001',
  repeat('5', 64), true, 'approved', now(),
  '51000000-0000-0000-0000-000000000001',
  '51000000-0000-0000-0000-000000000001'
);
insert into public.student_devices (
  id, school_id, student_id, token_hash
) values (
  'a5200000-0000-0000-0000-000000000001',
  'a5000000-0000-0000-0000-000000000001',
  'a5100000-0000-0000-0000-000000000001',
  repeat('6', 64)
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal2', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"51000000-0000-0000-0000-000000000001","aal":"aal2"}',
  true
);
select is(
  (select count(*)::integer from public.list_student_devices('a5100000-0000-0000-0000-000000000001')),
  1, 'teacher sees devices for a pupil at the same school'
);
select lives_ok(
  $$select public.set_student_active('a5100000-0000-0000-0000-000000000001', false)$$,
  'teacher can deactivate a pupil'
);
select is(
  (select active from public.students where id = 'a5100000-0000-0000-0000-000000000001'),
  false, 'pupil is inactive'
);
select isnt(
  (select revoked_at from public.list_student_devices('a5100000-0000-0000-0000-000000000001')
   where id = 'a5200000-0000-0000-0000-000000000001'),
  null::timestamptz, 'deactivation revokes every active device'
);
select lives_ok(
  $$select public.set_student_active('a5100000-0000-0000-0000-000000000001', true)$$,
  'teacher can reactivate the pupil profile'
);
select is(
  (select active from public.students where id = 'a5100000-0000-0000-0000-000000000001'),
  true, 'reactivated pupil is active'
);
select isnt(
  (select revoked_at from public.list_student_devices('a5100000-0000-0000-0000-000000000001')
   where id = 'a5200000-0000-0000-0000-000000000001'),
  null::timestamptz, 'reactivation does not silently restore old device access'
);
select throws_ok(
  $$select public.delete_student_permanently('a5100000-0000-0000-0000-000000000001')$$,
  'P0001', 'Kun en skoleadministrator kan slette eleven permanent',
  'teacher cannot permanently delete a pupil'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '53000000-0000-0000-0000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"53000000-0000-0000-0000-000000000003","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.set_student_active('a5100000-0000-0000-0000-000000000001', false)$$,
  'P0001', 'Godkendt elev blev ikke fundet på din skole',
  'another school cannot deactivate the pupil'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '52000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"52000000-0000-0000-0000-000000000002","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.delete_student_permanently('a5100000-0000-0000-0000-000000000001')$$,
  'school owner can permanently delete the pupil'
);
select is(
  (select count(*)::integer from public.students where id = 'a5100000-0000-0000-0000-000000000001'),
  0, 'pupil row is deleted'
);
select is(
  (select count(*)::integer from public.list_student_devices('a5100000-0000-0000-0000-000000000001')),
  0, 'pupil devices are cascade deleted'
);

select * from finish();
rollback;
