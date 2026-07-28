begin;
select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'b@example.test', '', now(), now(), now());

insert into public.schools (id, name, created_by) values
  ('a0000000-0000-0000-0000-000000000001', 'Skole A', '10000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'Skole B', '20000000-0000-0000-0000-000000000002');

insert into public.school_members (school_id, user_id, role) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('b0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'owner');

insert into public.students (
  id, school_id, local_reference_hash, created_by
) values
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', repeat('a', 64), '10000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', repeat('b', 64), '20000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*) from public.schools), 1::bigint, 'school A member sees one school');
select is((select name from public.schools), 'Skole A', 'school A member sees only school A');
select is((select count(*) from public.students), 1::bigint, 'school A member sees one student');
select is((select local_reference_hash from public.students), repeat('a', 64), 'school A member cannot read school B student');

select throws_ok(
  $$update public.students set birth_year = 2014 where id = 'b1000000-0000-0000-0000-000000000002'$$,
  'school A member cannot update school B student'
);
select throws_ok(
  $$insert into public.student_activities (school_id, student_id, activity_type, created_by)
    values ('a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'conversation_started', '10000000-0000-0000-0000-000000000001')$$,
  'cross-school activity is rejected'
);

select * from finish();
rollback;
