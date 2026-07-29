begin;
select plan(13);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'device-teacher-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '42000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'device-teacher-b@example.test', '', now(), now(), now());

insert into public.schools (id, name, created_by) values
  ('f0000000-0000-0000-0000-000000000001', 'Enhedsskole A', '41000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'Enhedsskole B', '42000000-0000-0000-0000-000000000002');
insert into public.school_members (school_id, user_id, role) values
  ('f0000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 'teacher'),
  ('f0000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000002', 'teacher');
insert into public.students (
  id, school_id, local_reference_hash, active, approval_status, approved_at, approved_by, created_by
) values
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', repeat('a', 64), true, 'approved', now(), '41000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', repeat('b', 64), true, 'approved', now(), '42000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temporary table access_test_state (grant_data jsonb, device_data jsonb);
grant select, update on access_test_state to anon, authenticated;
insert into access_test_state (grant_data)
select public.create_student_access('f1000000-0000-0000-0000-000000000001');

select ok((select grant_data ? 'token' from access_test_state), 'teacher receives an opaque access token');
select like((select grant_data ->> 'code' from access_test_state), '____-____-____', 'teacher receives a grouped fallback code');
select throws_ok(
  $$select public.create_student_access('f1000000-0000-0000-0000-000000000002')$$,
  'P0001', 'Approved pupil not found in your school',
  'teacher cannot create access for another school'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
update access_test_state
set device_data = public.redeem_student_access(grant_data ->> 'code');

select ok((select device_data ? 'device_token' from access_test_state), 'fallback code redeems to a device token');
select is(
  (select device_data ->> 'student_id' from access_test_state),
  'f1000000-0000-0000-0000-000000000001',
  'redeemed device is bound to the exact pupil id, not the name'
);
select throws_ok(
  $$select public.redeem_student_access((select grant_data ->> 'token' from access_test_state))$$,
  'P0001', 'Elevadgangen er ugyldig eller udløbet',
  'the same grant cannot be redeemed twice'
);
select is(
  (select public.student_device_status(device_data ->> 'device_token') ->> 'status' from access_test_state),
  'approved',
  'valid student device can check access'
);
select lives_ok(
  $$select public.record_student_device_activity(
    (select device_data ->> 'device_token' from access_test_state),
    'conversation_completed', 60
  )$$,
  'student device can record approved activity'
);
select is(
  (select count(*)::integer from public.student_activities
   where student_id = 'f1000000-0000-0000-0000-000000000001' and device_id is not null),
  1,
  'device activity is attributed to the exact pupil device'
);
select throws_ok(
  $$select public.student_device_status('wrong-token')$$,
  'P0001', 'Elevadgangen er ikke længere gyldig',
  'invalid device token is rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$select public.revoke_student_device(
    (select (device_data ->> 'device_id')::uuid from access_test_state)
  )$$,
  'same-school teacher can revoke a pupil device'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select throws_ok(
  $$select public.student_device_status(
    (select device_data ->> 'device_token' from access_test_state)
  )$$,
  'P0001', 'Elevadgangen er ikke længere gyldig',
  'revoked device stops working immediately'
);
select is(
  (select count(*)::integer from public.student_access_grants where redeemed_at is not null),
  1,
  'redemption is persisted once'
);

select * from finish();
rollback;
