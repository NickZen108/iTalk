begin;
select plan(5);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','63000000-0000-0000-0000-000000000001','authenticated','authenticated','owner-mfa@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','63000000-0000-0000-0000-000000000002','authenticated','authenticated','teacher-mfa@example.test','',now(),now(),now());

insert into public.schools (id, name, created_by)
values ('b8000000-0000-0000-0000-000000000001','MFA-skole','63000000-0000-0000-0000-000000000001');
insert into public.school_members (school_id,user_id,role,display_name) values
  ('b8000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','owner','Owner'),
  ('b8000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000002','teacher','Lærer');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','63000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claim.aal','aal1',true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"63000000-0000-0000-0000-000000000001","aal":"aal1"}',
  true
);

select is(
  public.is_school_admin('b8000000-0000-0000-0000-000000000001'),
  false,
  'owner role is insufficient at AAL1'
);
select throws_ok(
  $$select public.create_school_invitation('b8000000-0000-0000-0000-000000000001','new@example.test','teacher')$$,
  'P0001',
  'School administrator access required',
  'privileged invitation is rejected at AAL1'
);

select set_config('request.jwt.claim.aal','aal2',true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"63000000-0000-0000-0000-000000000001","aal":"aal2"}',
  true
);
select is(
  public.is_school_admin('b8000000-0000-0000-0000-000000000001'),
  true,
  'owner rights are active at AAL2'
);
select lives_ok(
  $$select public.create_school_invitation('b8000000-0000-0000-0000-000000000001','new@example.test','teacher')$$,
  'privileged invitation is allowed at AAL2'
);

select set_config('request.jwt.claim.sub','63000000-0000-0000-0000-000000000002',true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"63000000-0000-0000-0000-000000000002","aal":"aal2"}',
  true
);
select is(
  public.is_school_admin('b8000000-0000-0000-0000-000000000001'),
  false,
  'teacher is not elevated by an AAL2 session'
);

select * from finish();
rollback;
