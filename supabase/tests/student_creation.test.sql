begin;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '33000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'student-creator@example.test',
  '',
  now(),
  now(),
  now()
);

insert into public.schools (id, name, created_by) values (
  'e0000000-0000-0000-0000-000000000003',
  'Elevoprettelsesskole',
  '33000000-0000-0000-0000-000000000003'
);

insert into public.school_members (school_id, user_id, role) values (
  'e0000000-0000-0000-0000-000000000003',
  '33000000-0000-0000-0000-000000000003',
  'teacher'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.ensure_school_student(repeat('e', 64), 2014)$$,
  'teacher can create a pupil through the RPC'
);

select is(
  (
    select count(*)::integer
    from public.students
    where school_id = 'e0000000-0000-0000-0000-000000000003'
      and local_reference_hash = repeat('e', 64)
  ),
  1,
  'RPC creates exactly one pupil'
);

select lives_ok(
  $$select public.ensure_school_student(repeat('e', 64), 2015)$$,
  'reusing the local reference updates without ambiguity'
);

select * from finish();
rollback;
