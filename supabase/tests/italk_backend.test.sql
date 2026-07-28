begin;
select plan(12);

select has_table('public', 'schools', 'schools exists');
select has_table('public', 'school_members', 'school_members exists');
select has_table('public', 'students', 'students exists');
select has_table('public', 'student_activities', 'student_activities exists');
select has_table('public', 'billing_settings', 'billing_settings exists');
select has_table('public', 'monthly_report_runs', 'monthly_report_runs exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.schools'::regclass),
  'schools has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.students'::regclass),
  'students has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.student_activities'::regclass),
  'student activities have RLS enabled'
);

select is(
  (select price_ore from public.billing_settings where effective_until is null),
  10000,
  'default price is 100 DKK in ore'
);
select is(
  (select minimum_monthly_activities from public.billing_settings where effective_until is null),
  1,
  'one monthly activity makes a pupil billable'
);
select is(
  (select public from storage.buckets where id = 'school-media'),
  false,
  'school media bucket is private'
);

select * from finish();
rollback;
