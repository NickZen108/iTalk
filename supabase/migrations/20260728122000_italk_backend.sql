begin;

create extension if not exists pgcrypto with schema extensions;

create type public.school_role as enum ('owner', 'admin', 'teacher');
create type public.school_status as enum ('trial', 'active', 'suspended', 'closed');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  status public.school_status not null default 'trial',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_members (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.school_role not null default 'teacher',
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table public.school_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email_hash text not null,
  role public.school_role not null default 'teacher',
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  local_reference_hash text not null,
  birth_year smallint check (
    birth_year is null or birth_year between 1900 and extract(year from now())::int
  ),
  active boolean not null default true,
  last_activity_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, local_reference_hash)
);

comment on column public.students.local_reference_hash is
  'One-way SHA-256 reference generated on-device. Never store the pupil name here.';

create table public.student_activities (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  activity_type text not null check (activity_type in ('conversation_started', 'conversation_completed')),
  occurred_at timestamptz not null default now(),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index student_activities_school_month_idx
  on public.student_activities (school_id, occurred_at desc, student_id);
create index students_school_last_activity_idx
  on public.students (school_id, last_activity_at desc);
create index school_members_user_idx
  on public.school_members (user_id, school_id);

create table public.billing_settings (
  id bigint generated always as identity primary key,
  price_ore integer not null check (price_ore >= 0),
  minimum_monthly_activities integer not null default 1 check (minimum_monthly_activities > 0),
  effective_from date not null,
  effective_until date,
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until >= effective_from),
  exclude using gist (
    daterange(effective_from, coalesce(effective_until + 1, 'infinity'::date), '[)') with &&
  )
);

insert into public.billing_settings (price_ore, minimum_monthly_activities, effective_from)
values (10000, 1, date '2026-01-01');

create table public.monthly_report_runs (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  report_month date not null check (report_month = date_trunc('month', report_month)::date),
  billable_students integer not null check (billable_students >= 0),
  total_duration_seconds bigint not null default 0 check (total_duration_seconds >= 0),
  price_ore integer not null check (price_ore >= 0),
  amount_ore bigint not null check (amount_ore >= 0),
  delivery_status text not null default 'prepared'
    check (delivery_status in ('prepared', 'sent', 'failed')),
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (school_id, report_month)
);

create table public.report_outbox (
  id bigint generated always as identity primary key,
  report_run_id bigint not null unique references public.monthly_report_runs(id) on delete cascade,
  recipient text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

comment on table public.report_outbox is
  'Free-plan-safe mail queue. No external mail is sent until an approved mail transport is configured.';

create or replace function public.is_school_member(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_members sm
    where sm.school_id = target_school_id
      and sm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_school_admin(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_members sm
    where sm.school_id = target_school_id
      and sm.user_id = (select auth.uid())
      and sm.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_school_member(uuid) from public;
revoke all on function public.is_school_admin(uuid) from public;
grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.is_school_admin(uuid) to authenticated;

create or replace function public.register_school(school_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_school_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(school_name)) not between 2 and 120 then
    raise exception 'School name must be 2-120 characters';
  end if;
  if exists (
    select 1 from public.school_members
    where user_id = (select auth.uid())
  ) then
    raise exception 'User already belongs to a school';
  end if;

  insert into public.schools (name, created_by)
  values (trim(school_name), (select auth.uid()))
  returning id into new_school_id;

  insert into public.school_members (school_id, user_id, role)
  values (new_school_id, (select auth.uid()), 'owner');

  return new_school_id;
end;
$$;

revoke all on function public.register_school(text) from public;
grant execute on function public.register_school(text) to authenticated;

create or replace function public.create_school_invitation(
  target_school_id uuid,
  invite_email text,
  invite_role public.school_role default 'teacher'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not public.is_school_admin(target_school_id) then
    raise exception 'School administrator access required';
  end if;
  if invite_role = 'owner' then
    raise exception 'Owner role cannot be invited';
  end if;

  insert into public.school_invitations (
    school_id, email_hash, role, token_hash, created_by
  ) values (
    target_school_id,
    encode(extensions.digest(lower(trim(invite_email)), 'sha256'), 'hex'),
    invite_role,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    (select auth.uid())
  );
  return raw_token;
end;
$$;

revoke all on function public.create_school_invitation(uuid, text, public.school_role) from public;
grant execute on function public.create_school_invitation(uuid, text, public.school_role) to authenticated;

create or replace function public.claim_school_invitation(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.school_invitations%rowtype;
  caller_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
begin
  if (select auth.uid()) is null or caller_email = '' then
    raise exception 'Authenticated email required';
  end if;

  select * into invitation
  from public.school_invitations
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and email_hash = encode(extensions.digest(caller_email, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation is invalid or expired';
  end if;

  insert into public.school_members (school_id, user_id, role)
  values (invitation.school_id, (select auth.uid()), invitation.role);

  update public.school_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.school_id;
end;
$$;

revoke all on function public.claim_school_invitation(text) from public;
grant execute on function public.claim_school_invitation(text) to authenticated;

create or replace function public.touch_student_last_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.school_id <> (select school_id from public.students where id = new.student_id) then
    raise exception 'Student must belong to the same school';
  end if;
  update public.students
  set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at),
      updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

create trigger student_activity_updates_last_seen
after insert on public.student_activities
for each row execute function public.touch_student_last_activity();

create or replace function public.monthly_school_usage(target_month date default current_date)
returns table (
  school_id uuid,
  report_month date,
  billable_students bigint,
  total_duration_seconds bigint,
  price_ore integer,
  amount_ore bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select date_trunc('month', target_month)::date as month_start
  ),
  pricing as (
    select bs.price_ore, bs.minimum_monthly_activities
    from public.billing_settings bs, bounds b
    where bs.effective_from <= b.month_start
      and (bs.effective_until is null or bs.effective_until >= b.month_start)
    order by bs.effective_from desc
    limit 1
  ),
  per_student as (
    select
      a.school_id,
      a.student_id,
      count(*) as activity_count,
      coalesce(sum(a.duration_seconds), 0)::bigint as duration_seconds
    from public.student_activities a, bounds b
    where a.occurred_at >= b.month_start
      and a.occurred_at < b.month_start + interval '1 month'
      and public.is_school_member(a.school_id)
    group by a.school_id, a.student_id
  )
  select
    ps.school_id,
    b.month_start,
    count(*) filter (where ps.activity_count >= p.minimum_monthly_activities),
    coalesce(sum(ps.duration_seconds), 0)::bigint,
    p.price_ore,
    count(*) filter (where ps.activity_count >= p.minimum_monthly_activities) * p.price_ore
  from per_student ps cross join bounds b cross join pricing p
  group by ps.school_id, b.month_start, p.price_ore;
$$;

grant execute on function public.monthly_school_usage(date) to authenticated;

create or replace function public.prepare_monthly_reports(
  target_month date default (current_date - interval '1 month')::date,
  report_recipient text default 'nicolaipetersen108@gmail.com'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start date := date_trunc('month', target_month)::date;
  inserted_count integer;
begin
  with pricing as (
    select bs.price_ore, bs.minimum_monthly_activities
    from public.billing_settings bs
    where bs.effective_from <= month_start
      and (bs.effective_until is null or bs.effective_until >= month_start)
    order by bs.effective_from desc
    limit 1
  ),
  per_student as (
    select
      a.school_id,
      a.student_id,
      count(*) as activity_count,
      coalesce(sum(a.duration_seconds), 0)::bigint as duration_seconds
    from public.student_activities a
    where a.occurred_at >= month_start
      and a.occurred_at < month_start + interval '1 month'
    group by a.school_id, a.student_id
  ),
  school_totals as (
    select
      s.id as school_id,
      count(ps.student_id) filter (
        where ps.activity_count >= p.minimum_monthly_activities
      )::integer as billable_students,
      coalesce(sum(ps.duration_seconds), 0)::bigint as total_duration_seconds,
      p.price_ore
    from public.schools s
    cross join pricing p
    left join per_student ps on ps.school_id = s.id
    group by s.id, p.price_ore
  )
  insert into public.monthly_report_runs (
    school_id, report_month, billable_students, total_duration_seconds,
    price_ore, amount_ore
  )
  select
    st.school_id, month_start, st.billable_students, st.total_duration_seconds,
    st.price_ore, st.billable_students::bigint * st.price_ore
  from school_totals st
  on conflict (school_id, report_month) do update set
    billable_students = excluded.billable_students,
    total_duration_seconds = excluded.total_duration_seconds,
    price_ore = excluded.price_ore,
    amount_ore = excluded.amount_ore,
    delivery_status = 'prepared',
    prepared_at = now(),
    sent_at = null;

  get diagnostics inserted_count = row_count;

  insert into public.report_outbox (report_run_id, recipient, payload)
  select
    r.id,
    report_recipient,
    jsonb_build_object(
      'school_name', s.name,
      'report_month', r.report_month,
      'billable_students', r.billable_students,
      'total_duration_seconds', r.total_duration_seconds,
      'price_ore', r.price_ore,
      'amount_ore', r.amount_ore
    )
  from public.monthly_report_runs r
  join public.schools s on s.id = r.school_id
  where r.report_month = month_start
  on conflict (report_run_id) do update set
    recipient = excluded.recipient,
    payload = excluded.payload,
    status = 'pending',
    attempts = 0,
    processed_at = null;

  return inserted_count;
end;
$$;

revoke all on function public.prepare_monthly_reports(date, text) from public, anon, authenticated;
grant execute on function public.prepare_monthly_reports(date, text) to service_role;

alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.school_invitations enable row level security;
alter table public.students enable row level security;
alter table public.student_activities enable row level security;
alter table public.billing_settings enable row level security;
alter table public.monthly_report_runs enable row level security;
alter table public.report_outbox enable row level security;

revoke all on table
  public.schools,
  public.school_members,
  public.school_invitations,
  public.students,
  public.student_activities,
  public.billing_settings,
  public.monthly_report_runs,
  public.report_outbox
from anon, authenticated;

grant select, update on public.schools to authenticated;
grant select, update, delete on public.school_members to authenticated;
grant select, delete on public.school_invitations to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert on public.student_activities to authenticated;
grant select on public.billing_settings to authenticated;
grant select on public.monthly_report_runs to authenticated;
grant usage, select on sequence public.student_activities_id_seq to authenticated;

create policy schools_select_own on public.schools
for select to authenticated using (public.is_school_member(id));
create policy schools_admin_update on public.schools
for update to authenticated
using (public.is_school_admin(id))
with check (public.is_school_admin(id));

create policy members_select_own_school on public.school_members
for select to authenticated using (public.is_school_member(school_id));
create policy members_admin_update on public.school_members
for update to authenticated
using (public.is_school_admin(school_id))
with check (public.is_school_admin(school_id));
create policy members_admin_delete on public.school_members
for delete to authenticated using (
  public.is_school_admin(school_id)
  and user_id <> (select auth.uid())
  and role <> 'owner'
);

create policy invitations_admin_select on public.school_invitations
for select to authenticated using (public.is_school_admin(school_id));
create policy invitations_admin_delete on public.school_invitations
for delete to authenticated using (public.is_school_admin(school_id));

create policy students_select_own_school on public.students
for select to authenticated using (public.is_school_member(school_id));
create policy students_insert_own_school on public.students
for insert to authenticated with check (
  public.is_school_member(school_id)
  and created_by = (select auth.uid())
);
create policy students_update_own_school on public.students
for update to authenticated
using (public.is_school_member(school_id))
with check (public.is_school_member(school_id));
create policy students_admin_delete on public.students
for delete to authenticated using (public.is_school_admin(school_id));

create policy activities_select_own_school on public.student_activities
for select to authenticated using (public.is_school_member(school_id));
create policy activities_insert_own_school on public.student_activities
for insert to authenticated with check (
  public.is_school_member(school_id)
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_id and s.school_id = school_id and s.active
  )
);

create policy billing_settings_read on public.billing_settings
for select to authenticated using (true);

create policy reports_select_own_school on public.monthly_report_runs
for select to authenticated using (public.is_school_member(school_id));

revoke insert, update, delete on public.billing_settings from anon, authenticated;
revoke insert, update, delete on public.monthly_report_runs from anon, authenticated;
revoke all on public.report_outbox from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-media',
  'school-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy school_media_select on storage.objects
for select to authenticated using (
  bucket_id = 'school-media'
  and public.is_school_member(((storage.foldername(name))[1])::uuid)
);
create policy school_media_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'school-media'
  and public.is_school_member(((storage.foldername(name))[1])::uuid)
  and (storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
create policy school_media_update on storage.objects
for update to authenticated
using (
  bucket_id = 'school-media'
  and owner_id::text = (select auth.uid()::text)
  and public.is_school_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'school-media'
  and owner_id::text = (select auth.uid()::text)
  and public.is_school_member(((storage.foldername(name))[1])::uuid)
);
create policy school_media_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'school-media'
  and (
    owner_id::text = (select auth.uid()::text)
    or public.is_school_admin(((storage.foldername(name))[1])::uuid)
  )
);

commit;
