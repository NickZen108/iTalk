begin;
select plan(20);

select ok(to_regclass('public.school_approvals') is not null, 'private approval table exists');
select ok(to_regclass('public.supplier_notification_settings') is not null, 'private routing table exists');
select ok(to_regclass('public.supplier_notification_outbox') is not null, 'private outbox exists');
select ok(
  exists (
    select 1 from pg_attribute
    where attrelid = 'public.supplier_notification_outbox'::regclass
      and attname = 'customer_id' and not attisdropped
  ),
  'outbox has opaque customer_id'
);
select ok(
  not exists (
    select 1 from pg_attribute
    where attrelid = 'public.supplier_notification_outbox'::regclass
      and attname in ('school_id','recipient','signer','notes','url') and not attisdropped
  ),
  'outbox excludes school, recipient, signer, notes and URL'
);
select ok(
  not has_table_privilege('authenticated', 'public.school_approvals', 'SELECT'),
  'authenticated clients have no direct approval-table access'
);
select ok(
  not has_table_privilege('authenticated', 'public.supplier_notification_settings', 'SELECT'),
  'authenticated clients cannot read the routing address'
);
select ok(
  not has_table_privilege('authenticated', 'public.supplier_notification_outbox', 'SELECT'),
  'authenticated clients cannot read the outbox'
);
select ok(
  not has_table_privilege('authenticated', 'public.supplier_notification_outbox', 'INSERT'),
  'authenticated clients cannot forge outbox items'
);
select is(
  (select delivery_status from public.supplier_notification_outbox limit 1),
  null::text,
  'outbox starts empty; no external sender is installed'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','65000000-0000-0000-0000-000000000001','authenticated','authenticated','approval-owner-a@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','65000000-0000-0000-0000-000000000002','authenticated','authenticated','approval-teacher-a@example.test','',now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','65000000-0000-0000-0000-000000000003','authenticated','authenticated','approval-owner-b@example.test','',now(),now(),now());

insert into public.schools (id, name, created_by) values
  ('ba000000-0000-0000-0000-000000000001','Godkendelsesskole A','65000000-0000-0000-0000-000000000001'),
  ('ba000000-0000-0000-0000-000000000002','Godkendelsesskole B','65000000-0000-0000-0000-000000000003');
insert into public.school_members (school_id,user_id,role,display_name) values
  ('ba000000-0000-0000-0000-000000000001','65000000-0000-0000-0000-000000000001','owner','Owner A'),
  ('ba000000-0000-0000-0000-000000000001','65000000-0000-0000-0000-000000000002','teacher','Teacher A'),
  ('ba000000-0000-0000-0000-000000000002','65000000-0000-0000-0000-000000000003','owner','Owner B');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"65000000-0000-0000-0000-000000000001","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.set_supplier_notification_setting('ba000000-0000-0000-0000-000000000001',true,'receipt@example.test')$$,
  'P0001',
  'School administrator access required',
  'AAL1 owner cannot configure the receipt destination'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"65000000-0000-0000-0000-000000000001","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.set_supplier_notification_setting('ba000000-0000-0000-0000-000000000001',true,'receipt@example.test')$$,
  'AAL2 owner can configure the private receipt destination'
);
select results_eq(
  $$select enabled, recipient_configured from public.get_supplier_notification_setting('ba000000-0000-0000-0000-000000000001')$$,
  $$values (true,true)$$,
  'read RPC reveals only whether a destination is configured'
);
select lives_ok(
  $$select public.save_school_approval(
    'ba000000-0000-0000-0000-000000000001','data-processing-agreement','1.0',
    'approved','2026-07-30 08:00:00+00','2027-07-30','dpo','SAG-2026-001',
    repeat('a',64),'0.4.1'
  )$$,
  'AAL2 owner can save an approval'
);

reset role;
select is(
  (select count(*)::int from public.supplier_notification_outbox),
  1,
  'an enabled receipt creates exactly one private outbox item'
);
select results_eq(
  $$select status, delivery_status from public.supplier_notification_outbox$$,
  $$values ('approved'::text,'blocked_no_provider'::text)$$,
  'outbox is blocked until an approved sender exists'
);
select is(
  (select count(*)::int from public.supplier_notification_outbox
   where customer_id is not null and document_sha256 = repeat('a',64)),
  1,
  'outbox contains only the opaque routing id and minimized receipt metadata'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"65000000-0000-0000-0000-000000000002","aal":"aal2"}',
  true
);
select is(
  (select count(*)::int from public.get_school_approval_registry('ba000000-0000-0000-0000-000000000001')),
  0,
  'teacher cannot read the approval registry'
);
select throws_ok(
  $$select public.set_supplier_notification_setting('ba000000-0000-0000-0000-000000000001',false,null)$$,
  'P0001',
  'School administrator access required',
  'teacher cannot alter receipt settings'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"65000000-0000-0000-0000-000000000003","aal":"aal2"}',
  true
);
select is(
  (select count(*)::int from public.get_school_approval_registry('ba000000-0000-0000-0000-000000000001')),
  0,
  'another school owner cannot read the registry'
);
select * from finish();
rollback;
