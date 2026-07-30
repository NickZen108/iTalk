-- Dataminimeret skolegodkendelsesregister. Bruger kun Supabase Postgres/Auth/RLS.
begin;

create table public.supplier_notification_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  customer_id uuid not null unique default gen_random_uuid(),
  enabled boolean not null default false,
  recipient_email text check (
    recipient_email is null or
    recipient_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  updated_at timestamptz not null default now()
);

create table public.school_approvals (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  document_type text not null check (document_type ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  document_version text not null check (char_length(document_version) between 1 and 40),
  status text not null check (status in ('draft', 'approved', 'rejected', 'expired')),
  approved_at timestamptz,
  review_at date not null,
  approver_role text not null check (approver_role in ('school_owner', 'school_admin', 'dpo', 'it_security', 'management')),
  archive_reference text not null check (
    char_length(archive_reference) between 1 and 120
    and archive_reference !~* '(://|www\.|@)'
  ),
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, document_type, document_version),
  check ((status = 'approved') = (approved_at is not null))
);

create table public.supplier_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  app_version text not null check (char_length(app_version) between 1 and 40),
  status text not null check (status in ('approved', 'rejected', 'expired')),
  approved_at timestamptz,
  review_at date not null,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  delivery_status text not null default 'blocked_no_provider'
    check (delivery_status in ('blocked_no_provider', 'ready', 'sent', 'failed')),
  check ((status = 'approved') = (approved_at is not null))
);

alter table public.school_approvals enable row level security;
alter table public.supplier_notification_settings enable row level security;
alter table public.supplier_notification_outbox enable row level security;
revoke all on public.school_approvals, public.supplier_notification_settings,
  public.supplier_notification_outbox from public, anon, authenticated;

create or replace function public.get_school_approval_registry(target_school_id uuid)
returns table (
  id uuid, document_type text, document_version text, status text,
  approved_at timestamptz, review_at date, approver_role text,
  archive_reference text, document_sha256 text, updated_at timestamptz
)
language sql security definer set search_path = ''
as $$
  select a.id, a.document_type, a.document_version, a.status, a.approved_at,
         a.review_at, a.approver_role, a.archive_reference, a.document_sha256, a.updated_at
  from public.school_approvals a
  where a.school_id = target_school_id and public.is_school_admin(target_school_id)
  order by a.review_at, a.document_type;
$$;

create or replace function public.get_supplier_notification_setting(target_school_id uuid)
returns table (enabled boolean, recipient_configured boolean)
language sql security definer set search_path = ''
as $$
  select coalesce(s.enabled, false), s.recipient_email is not null
  from (select 1) as placeholder
  left join public.supplier_notification_settings s
    on s.school_id = target_school_id
  where public.is_school_admin(target_school_id);
$$;

create or replace function public.set_supplier_notification_setting(
  target_school_id uuid, requested_enabled boolean, requested_recipient text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_school_admin(target_school_id) then
    raise exception 'School administrator access required';
  end if;
  if requested_enabled and nullif(trim(requested_recipient), '') is null
     and not exists (
       select 1 from public.supplier_notification_settings
       where school_id = target_school_id and recipient_email is not null
     ) then
    raise exception 'Recipient required when notification is enabled';
  end if;
  insert into public.supplier_notification_settings (
    school_id, enabled, recipient_email
  ) values (
    target_school_id,
    requested_enabled,
    nullif(lower(trim(requested_recipient)), '')
  )
  on conflict (school_id) do update set
    enabled = excluded.enabled,
    recipient_email = case
      when requested_recipient is null or trim(requested_recipient) = ''
        then public.supplier_notification_settings.recipient_email
      else lower(trim(requested_recipient))
    end,
    updated_at = now();
end;
$$;

create or replace function public.save_school_approval(
  target_school_id uuid, requested_document_type text, requested_document_version text,
  requested_status text, requested_approved_at timestamptz, requested_review_at date,
  requested_approver_role text, requested_archive_reference text,
  requested_document_sha256 text, requested_app_version text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  approval_id uuid;
  notification_setting public.supplier_notification_settings%rowtype;
begin
  if not public.is_school_admin(target_school_id) then
    raise exception 'School administrator access required';
  end if;
  insert into public.school_approvals (
    school_id, document_type, document_version, status, approved_at, review_at,
    approver_role, archive_reference, document_sha256
  ) values (
    target_school_id, lower(trim(requested_document_type)), trim(requested_document_version),
    requested_status, requested_approved_at, requested_review_at, requested_approver_role,
    trim(requested_archive_reference), lower(trim(requested_document_sha256))
  )
  on conflict (school_id, document_type, document_version) do update set
    status = excluded.status, approved_at = excluded.approved_at, review_at = excluded.review_at,
    approver_role = excluded.approver_role, archive_reference = excluded.archive_reference,
    document_sha256 = excluded.document_sha256, updated_at = now()
  returning id into approval_id;

  select * into notification_setting
  from public.supplier_notification_settings
  where school_id = target_school_id;
  if notification_setting.enabled and requested_status in ('approved','rejected','expired') then
    insert into public.supplier_notification_outbox (
      customer_id, app_version, status, approved_at, review_at, document_sha256
    ) values (
      notification_setting.customer_id, trim(requested_app_version), requested_status,
      requested_approved_at, requested_review_at, lower(trim(requested_document_sha256))
    );
  end if;
  return approval_id;
end;
$$;

comment on table public.supplier_notification_outbox is
  'No delivery worker/provider is installed. Payload intentionally excludes school/elev/signer/contact/PDF/notes/URLs.';
comment on table public.supplier_notification_settings is
  'Private routing configuration. Direct client access is denied; recipient email is write-only through RPC.';
revoke all on function public.get_school_approval_registry(uuid) from public, anon;
revoke all on function public.get_supplier_notification_setting(uuid) from public, anon;
revoke all on function public.set_supplier_notification_setting(uuid,boolean,text) from public, anon;
revoke all on function public.save_school_approval(uuid,text,text,text,timestamptz,date,text,text,text,text) from public, anon;
grant execute on function public.get_school_approval_registry(uuid) to authenticated;
grant execute on function public.get_supplier_notification_setting(uuid) to authenticated;
grant execute on function public.set_supplier_notification_setting(uuid,boolean,text) to authenticated;
grant execute on function public.save_school_approval(uuid,text,text,text,timestamptz,date,text,text,text,text) to authenticated;

commit;
