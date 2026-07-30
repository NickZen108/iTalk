begin;

-- Owner- og administratorrettigheder er kun aktive i en session, hvor Supabase
-- Auth har bekræftet en ekstra faktor. Rollen alene er ikke tilstrækkelig.
create or replace function public.is_school_admin(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (
      select 1
      from public.school_members sm
      where sm.school_id = target_school_id
        and sm.user_id = (select auth.uid())
        and sm.role in ('owner', 'admin')
    );
$$;

comment on function public.is_school_admin(uuid) is
  'True only for an owner/admin in the school with a current Authenticator Assurance Level 2 session.';

revoke all on function public.is_school_admin(uuid) from public, anon;
grant execute on function public.is_school_admin(uuid) to authenticated;

commit;
