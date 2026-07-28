begin;

-- Required for transactional CI verification against the hosted database.
-- Test files run inside transactions and roll back all temporary test data.
create extension if not exists pgtap with schema extensions;

commit;
