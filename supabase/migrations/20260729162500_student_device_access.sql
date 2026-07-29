begin;

create table public.student_access_grants (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  redeemed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.student_devices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  last_used_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index student_access_grants_student_idx
  on public.student_access_grants (student_id, expires_at desc);
create index student_devices_student_idx
  on public.student_devices (student_id, revoked_at, last_used_at desc);

alter table public.student_access_grants enable row level security;
alter table public.student_devices enable row level security;
revoke all on public.student_access_grants, public.student_devices from public, anon, authenticated;

alter table public.student_activities
  alter column created_by drop not null,
  add column device_id uuid references public.student_devices(id);

alter table public.student_activities
  add constraint student_activity_has_one_actor check (
    (created_by is not null and device_id is null)
    or (created_by is null and device_id is not null)
  );

create or replace function public.create_student_access(target_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
  raw_code text := upper(encode(extensions.gen_random_bytes(6), 'hex'));
  target_school uuid;
  grant_expiry timestamptz := now() + interval '15 minutes';
begin
  select s.school_id into target_school
  from public.students s
  where s.id = target_student_id
    and s.approval_status = 'approved'
    and s.active
    and public.is_school_member(s.school_id);

  if target_school is null then
    raise exception 'Approved pupil not found in your school';
  end if;

  update public.student_access_grants
  set expires_at = least(expires_at, now())
  where student_id = target_student_id
    and redeemed_at is null
    and expires_at > now();

  insert into public.student_access_grants (
    school_id, student_id, token_hash, code_hash, expires_at, created_by
  ) values (
    target_school,
    target_student_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    encode(extensions.digest(raw_code, 'sha256'), 'hex'),
    grant_expiry,
    (select auth.uid())
  );

  return jsonb_build_object(
    'token', raw_token,
    'code', substring(raw_code from 1 for 4) || '-' ||
            substring(raw_code from 5 for 4) || '-' ||
            substring(raw_code from 9 for 4),
    'expires_at', grant_expiry
  );
end;
$$;

create or replace function public.redeem_student_access(access_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_secret text := regexp_replace(coalesce(access_secret, ''), '[^A-Fa-f0-9]', '', 'g');
  secret_hash text;
  access_grant public.student_access_grants%rowtype;
  raw_device_token text := encode(extensions.gen_random_bytes(32), 'hex');
  new_device_id uuid;
begin
  if char_length(normalized_secret) not in (12, 48) then
    raise exception 'Elevadgangen er ugyldig eller udløbet';
  end if;
  secret_hash := encode(extensions.digest(
    case when char_length(normalized_secret) = 12 then upper(normalized_secret) else lower(normalized_secret) end,
    'sha256'
  ), 'hex');

  select g.* into access_grant
  from public.student_access_grants g
  where (g.token_hash = secret_hash or g.code_hash = secret_hash)
    and g.redeemed_at is null
    and g.expires_at > now()
  for update;

  if access_grant.id is null then
    raise exception 'Elevadgangen er ugyldig eller udløbet';
  end if;

  insert into public.student_devices (school_id, student_id, token_hash)
  values (
    access_grant.school_id,
    access_grant.student_id,
    encode(extensions.digest(raw_device_token, 'sha256'), 'hex')
  )
  returning id into new_device_id;

  update public.student_access_grants
  set redeemed_at = now()
  where id = access_grant.id;

  return jsonb_build_object(
    'device_token', raw_device_token,
    'student_id', access_grant.student_id,
    'device_id', new_device_id
  );
end;
$$;

create or replace function public.student_device_status(device_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  device_record public.student_devices%rowtype;
  pupil_status text;
begin
  select d.* into device_record
  from public.student_devices d
  where d.token_hash = encode(extensions.digest(coalesce(device_token, ''), 'sha256'), 'hex')
    and d.revoked_at is null;

  if device_record.id is null then
    raise exception 'Elevadgangen er ikke længere gyldig';
  end if;

  select s.approval_status into pupil_status
  from public.students s
  where s.id = device_record.student_id and s.active;

  if pupil_status is distinct from 'approved' then
    raise exception 'Elevadgangen er ikke længere gyldig';
  end if;

  update public.student_devices set last_used_at = now() where id = device_record.id;
  return jsonb_build_object('student_id', device_record.student_id, 'status', 'approved');
end;
$$;

create or replace function public.record_student_device_activity(
  device_token text,
  requested_activity_type text,
  requested_duration_seconds integer default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  device_record public.student_devices%rowtype;
  activity_id bigint;
begin
  if requested_activity_type not in ('conversation_started', 'conversation_completed') then
    raise exception 'Invalid activity type';
  end if;
  if requested_duration_seconds is not null
     and requested_duration_seconds not between 0 and 3600 then
    raise exception 'Invalid activity duration';
  end if;

  select d.* into device_record
  from public.student_devices d
  join public.students s on s.id = d.student_id
  where d.token_hash = encode(extensions.digest(coalesce(device_token, ''), 'sha256'), 'hex')
    and d.revoked_at is null
    and s.active
    and s.approval_status = 'approved';

  if device_record.id is null then
    raise exception 'Elevadgangen er ikke længere gyldig';
  end if;

  insert into public.student_activities (
    school_id, student_id, activity_type, duration_seconds, created_by, device_id
  ) values (
    device_record.school_id,
    device_record.student_id,
    requested_activity_type,
    requested_duration_seconds,
    null,
    device_record.id
  )
  returning id into activity_id;

  update public.student_devices set last_used_at = now() where id = device_record.id;
  return activity_id;
end;
$$;

create or replace function public.revoke_student_device(target_device_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.student_devices d
  set revoked_at = now()
  where d.id = target_device_id
    and public.is_school_member(d.school_id);
  if not found then
    raise exception 'Elev-enheden blev ikke fundet på din skole';
  end if;
end;
$$;

revoke all on function public.create_student_access(uuid) from public, anon;
revoke all on function public.redeem_student_access(text) from public;
revoke all on function public.student_device_status(text) from public;
revoke all on function public.record_student_device_activity(text, text, integer) from public;
revoke all on function public.revoke_student_device(uuid) from public, anon;
grant execute on function public.create_student_access(uuid) to authenticated;
grant execute on function public.redeem_student_access(text) to anon, authenticated;
grant execute on function public.student_device_status(text) to anon, authenticated;
grant execute on function public.record_student_device_activity(text, text, integer) to anon, authenticated;
grant execute on function public.revoke_student_device(uuid) to authenticated;

commit;
