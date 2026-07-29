begin;

-- Staff accounts are invite-only. Public clients may no longer create schools.
revoke execute on function public.register_school(text) from authenticated;
grant execute on function public.register_school(text) to service_role;

create unique index if not exists school_invitations_one_open_email
  on public.school_invitations (school_id, email_hash)
  where accepted_at is null;

create unique index if not exists school_members_one_school_per_user
  on public.school_members (user_id);

revoke update on public.school_members from authenticated;
drop policy if exists members_admin_update on public.school_members;

create table public.school_bootstraps (
  id uuid primary key default gen_random_uuid(),
  school_name text not null check (char_length(trim(school_name)) between 2 and 120),
  email_hash text not null,
  token_hash text not null unique,
  display_name text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.school_bootstraps enable row level security;
revoke all on public.school_bootstraps from anon, authenticated;
grant select on public.school_bootstraps to supabase_auth_admin;

create policy school_bootstraps_auth_hook_read on public.school_bootstraps
for select to supabase_auth_admin using (true);

create or replace function public.hook_allow_invited_staff(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_email text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if signup_email = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'En gyldig medarbejderinvitation er påkrævet.'
      )
    );
  end if;

  if exists (
    select 1
    from public.school_invitations invitation
    where invitation.email_hash =
      encode(extensions.digest(signup_email, 'sha256'), 'hex')
      and invitation.accepted_at is null
      and invitation.expires_at > now()
  ) then
    return '{}'::jsonb;
  end if;

  if exists (
    select 1
    from public.school_bootstraps bootstrap
    where bootstrap.email_hash =
      encode(extensions.digest(signup_email, 'sha256'), 'hex')
      and bootstrap.claimed_at is null
      and bootstrap.expires_at > now()
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Denne e-mail er ikke inviteret af en skoleadministrator.'
    )
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_allow_invited_staff(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_allow_invited_staff(jsonb)
  from anon, authenticated, public;
grant select on public.school_invitations to supabase_auth_admin;

create policy invitations_auth_hook_read on public.school_invitations
for select to supabase_auth_admin using (true);

create or replace function public.create_school_bootstrap(
  school_name text,
  owner_email text,
  owner_display_name text,
  raw_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  bootstrap_id uuid;
begin
  if raw_token !~ '^[a-f0-9]{48}$' then
    raise exception 'Bootstrap token must be 48 lowercase hexadecimal characters';
  end if;
  insert into public.school_bootstraps (
    school_name, email_hash, token_hash, display_name
  ) values (
    trim(school_name),
    encode(extensions.digest(lower(trim(owner_email)), 'sha256'), 'hex'),
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    nullif(trim(owner_display_name), '')
  )
  returning id into bootstrap_id;
  return bootstrap_id;
end;
$$;

revoke all on function public.create_school_bootstrap(text, text, text, text) from public;
grant execute on function public.create_school_bootstrap(text, text, text, text) to service_role;

create or replace function public.claim_school_bootstrap(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  bootstrap public.school_bootstraps%rowtype;
  caller_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  new_school_id uuid;
begin
  if (select auth.uid()) is null or caller_email = '' then
    raise exception 'Authenticated email required';
  end if;
  if exists (
    select 1 from public.school_members
    where user_id = (select auth.uid())
  ) then
    raise exception 'User already belongs to a school';
  end if;

  select * into bootstrap
  from public.school_bootstraps
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and email_hash = encode(extensions.digest(caller_email, 'sha256'), 'hex')
    and claimed_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Bootstrap is invalid or expired';
  end if;

  insert into public.schools (name, created_by)
  values (bootstrap.school_name, (select auth.uid()))
  returning id into new_school_id;

  insert into public.school_members (school_id, user_id, role, display_name)
  values (new_school_id, (select auth.uid()), 'owner', bootstrap.display_name);

  update public.school_bootstraps
  set claimed_at = now()
  where id = bootstrap.id;

  return new_school_id;
end;
$$;

revoke all on function public.claim_school_bootstrap(text) from public;
grant execute on function public.claim_school_bootstrap(text) to authenticated;

commit;
