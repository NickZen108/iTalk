const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const migrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260728122000_italk_backend.sql"
);
const sql = fs.readFileSync(migrationPath, "utf8");
const approvalSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260728203000_student_teacher_approval.sql"),
  "utf8"
);
const inviteOnlySql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729093000_invite_only_staff.sql"),
  "utf8"
);
const reliableStudentSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729111500_reliable_student_creation.sql"),
  "utf8"
);
const studentDeviceSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729162500_student_device_access.sql"),
  "utf8"
);
const studentLifecycleSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729170000_student_lifecycle.sql"),
  "utf8"
);
const studentAuditSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729172500_student_audit_log.sql"),
  "utf8"
);
const studentAuditOrderingSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729174500_order_student_audit_events.sql"),
  "utf8"
);
const schoolAuditSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260729221500_school_audit_log.sql"),
  "utf8"
);
const studentNamesSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260730080000_student_display_names.sql"),
  "utf8"
);
const restoredStudentGrantsSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260730081000_restore_student_table_rls_grants.sql"),
  "utf8"
);
const adminMfaSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260730101500_admin_mfa_aal2.sql"),
  "utf8"
);
const retentionSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260730113000_retention_and_student_rights.sql"),
  "utf8"
);

test("backend-migrationen har de nødvendige tenant-tabeller", () => {
  [
    "schools",
    "school_members",
    "school_invitations",
    "students",
    "student_activities",
    "billing_settings",
    "monthly_report_runs",
    "report_outbox",
  ].forEach((table) => {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`));
  });
});

test("alle tabeller med skoledata beskyttes af RLS", () => {
  [
    "schools",
    "school_members",
    "school_invitations",
    "students",
    "student_activities",
    "monthly_report_runs",
    "report_outbox",
  ].forEach((table) => {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  });
  assert.match(sql, /public\.is_school_member\(school_id\)/);
  assert.match(sql, /public\.is_school_admin\(school_id\)/);
});

test("grundmigrationen gemmer kun en pseudonym elevreference", () => {
  const studentTable = sql.match(
    /create table public\.students \(([\s\S]*?)\n\);/
  )[1];
  ["name", "email", "photo", "avatar", "conversation", "transcript", "notes"].forEach(
    (forbidden) => assert.doesNotMatch(studentTable, new RegExp(`\\b${forbidden}\\b`, "i"))
  );
  assert.match(studentTable, /local_reference_hash text not null/);
});

test("elevnavne lagres skoleafgrænset gennem validerede RPC'er", () => {
  assert.match(studentNamesSql, /add column display_name text/);
  assert.match(studentNamesSql, /char_length\(display_name\) between 1 and 80/);
  assert.match(studentNamesSql, /create function public\.ensure_school_student\(/);
  assert.match(studentNamesSql, /student_display_name text default null/);
  assert.match(studentNamesSql, /where sm\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(studentNamesSql, /create or replace function public\.list_school_students\(\)/);
  assert.match(studentNamesSql, /where public\.is_school_member\(s\.school_id\)/);
  assert.match(studentNamesSql, /revoke insert, update, delete on public\.students from authenticated/);
  assert.match(restoredStudentGrantsSql, /grant select, insert, update on public\.students to authenticated/);
  assert.match(studentNamesSql, /grant execute on function public\.list_school_students\(\) to authenticated/);
  assert.doesNotMatch(studentNamesSql, /grant execute on function public\.list_school_students\(\) to anon/);
  assert.match(studentNamesSql, /create or replace function public\.record_staff_student_activity\(/);
  assert.match(studentNamesSql, /and public\.is_school_member\(s\.school_id\)/);
  assert.match(
    studentNamesSql,
    /grant execute on function public\.record_staff_student_activity\(uuid, text, integer\) to authenticated/
  );
});

test("elevnavnet lækkes ikke gennem adgangs-, aktivitets- eller auditmigrationer", () => {
  [studentDeviceSql, studentAuditSql, schoolAuditSql].forEach(migration => {
    assert.doesNotMatch(migration, /\b(?:s\.display_name|student_name)\b/i);
  });
});

test("månedlig pris er 100 kr og aktivitetsgrænsen kan versionsstyres", () => {
  assert.match(sql, /price_ore integer not null/);
  assert.match(sql, /minimum_monthly_activities integer not null default 1/);
  assert.match(sql, /values \(10000, 1, date '2026-01-01'\)/);
  assert.match(sql, /effective_from date not null/);
  assert.match(sql, /effective_until date/);
});

test("medielager er privat, billedbegrænset og skoleafgrænset", () => {
  assert.match(sql, /'school-media'[\s\S]*false[\s\S]*5242880/);
  assert.match(sql, /array\['image\/jpeg', 'image\/png', 'image\/webp'\]/);
  assert.match(sql, /storage\.foldername\(name\)/);
  assert.match(sql, /bucket_id = 'school-media'/);
});

test("rapportmail er kun klargjort som en lukket kø", () => {
  assert.match(sql, /create or replace function public\.prepare_monthly_reports/);
  assert.match(sql, /delivery_status text not null default 'prepared'/);
  assert.match(sql, /revoke all on public\.report_outbox from anon, authenticated/);
  assert.doesNotMatch(sql, /resend\.com|sendgrid|mailgun/i);
});

test("hemmeligheder og lokale miljøfiler kan ikke blive committed", () => {
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.doesNotMatch(example, /service_role\s*=\s*\S+/i);
});

test("browserklienten bruger kun runtime-miljø og publishable key", () => {
  const client = fs.readFileSync(path.join(root, "src", "supabase-client.js"), "utf8");
  const build = fs.readFileSync(path.join(root, "scripts", "build.js"), "utf8");
  assert.match(client, /ELEVSPOR_CONFIG/);
  assert.match(client, /createClient\(config\.supabaseUrl, config\.supabasePublishableKey/);
  assert.match(build, /process\.env\.SUPABASE_URL/);
  assert.match(build, /process\.env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(client, /service[_-]?role|secret[_-]?key/i);
  assert.doesNotMatch(build, /service[_-]?role|secret[_-]?key/i);
});

test("elevens lokale reference hashes før synkronisering", () => {
  const client = fs.readFileSync(path.join(root, "src", "supabase-client.js"), "utf8");
  assert.match(client, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(client, /local_reference_hash: localReferenceHash/);
  assert.doesNotMatch(client, /\.(from|rpc)\(["'](?:photos|transcripts|student_names)/);
});

test("nye elever afventer lærer og kan ikke skabe aktivitet før godkendelse", () => {
  assert.match(approvalSql, /approval_status text not null default 'pending'/);
  assert.match(approvalSql, /alter column active set default false/);
  assert.match(approvalSql, /create or replace function public\.approve_student/);
  assert.match(approvalSql, /public\.is_school_member\(school_id\)/);
  assert.match(approvalSql, /s\.approval_status = 'approved'/);
  assert.doesNotMatch(approvalSql, /grant execute on function public\.approve_student\(uuid\) to anon/);
});

test("elevoprettelse sker atomisk i medarbejderens egen skole", () => {
  assert.match(reliableStudentSql, /create or replace function public\.ensure_school_student/);
  assert.match(reliableStudentSql, /where user_id = \(select auth\.uid\(\)\)/);
  assert.match(reliableStudentSql, /on conflict \(school_id, local_reference_hash\)/);
  assert.match(reliableStudentSql, /grant execute on function public\.ensure_school_student\(text, integer\) to authenticated/);
  assert.match(reliableStudentSql, /revoke all on function public\.ensure_school_student\(text, integer\) from public, anon/);
});

test("elevoprettelsens lokale reference er entydig i PostgreSQL", () => {
  const fixSql = fs.readFileSync(
    path.join(root, "supabase", "migrations", "20260729133500_fix_student_parameter_scope.sql"),
    "utf8"
  );
  assert.match(fixSql, /student_reference_hash text := local_reference_hash/);
  assert.match(fixSql, /member_school_id,\s+student_reference_hash,/);
  assert.match(fixSql, /on conflict on constraint students_school_id_local_reference_hash_key/);
  assert.doesNotMatch(fixSql, /ensure_school_student_fn\.local_reference_hash/);
});

test("bekræftelses- og invitationsmails er brandede og har fallback-link", () => {
  for (const file of ["confirmation.html", "invite.html"]) {
    const template = fs.readFileSync(path.join(root, "supabase", "templates", file), "utf8");
    assert.match(template, /elevspor-logo\.png/);
    assert.match(template, /href="\{\{ \.ConfirmationURL \}\}"/);
    assert.match(template, />\{\{ \.ConfirmationURL \}\}<\/a>/);
  }
});

test("fakturering kræver aktivitet og pending elever kan derfor ikke faktureres", () => {
  assert.match(sql, /from public\.student_activities a/);
  assert.match(approvalSql, /drop policy activities_insert_own_school/);
  assert.match(approvalSql, /activities_insert_approved_student/);
});

test("CI kører web-, database- og RLS-testpakken før merge", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /supabase db reset/);
  assert.match(workflow, /supabase test db/);
  assert.ok(fs.existsSync(path.join(root, "supabase/tests/rls_isolation.test.sql")));
});

test("hostede migrationer bruger kun GitHub-secrets med nødvendige rettigheder", () => {
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-supabase.yml"),
    "utf8"
  );
  assert.match(workflow, /secrets\.SUPABASE_ACCESS_TOKEN/);
  assert.match(workflow, /secrets\.SUPABASE_DB_PASSWORD/);
  assert.match(workflow, /vars\.SUPABASE_PROJECT_REF/);
  assert.match(workflow, /supabase db push --linked/);
  assert.match(workflow, /api\.supabase\.com\/v1\/projects\/\$SUPABASE_PROJECT_REF\/config\/auth/);
  assert.match(workflow, /hook_before_user_created_enabled/);
  assert.match(workflow, /mailer_templates_confirmation_content/);
  assert.match(workflow, /mailer_templates_invite_content/);
  assert.doesNotMatch(workflow, /supabase config push/);
  assert.match(workflow, /supabase test db --linked/);
  assert.match(workflow, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(workflow, /Expected anonymous schools request to be denied with HTTP 401/);
  assert.match(workflow, /\.code == "42501"/);
  assert.doesNotMatch(workflow, /GRANT SELECT ON public\.schools TO anon/i);
  assert.doesNotMatch(workflow, /secrets\.(?:SERVICE_ROLE|SUPABASE_SECRET)/i);
  assert.doesNotMatch(workflow, /set -x/);
});

test("medarbejderoprettelse er invitationsbaseret og skole-bootstrap er beskyttet", () => {
  assert.match(inviteOnlySql, /revoke execute on function public\.register_school\(text\) from authenticated/);
  assert.match(inviteOnlySql, /grant execute on function public\.register_school\(text\) to service_role/);
  assert.match(inviteOnlySql, /unique index if not exists school_members_one_school_per_user/);
  assert.match(inviteOnlySql, /revoke update on public\.school_members from authenticated/);
  assert.match(inviteOnlySql, /drop policy if exists members_admin_update/);
  assert.match(inviteOnlySql, /create or replace function public\.hook_allow_invited_staff/);
  assert.match(inviteOnlySql, /invitation\.accepted_at is null/);
  assert.match(inviteOnlySql, /invitation\.expires_at > now\(\)/);
  assert.match(inviteOnlySql, /to supabase_auth_admin/);
  assert.match(inviteOnlySql, /revoke execute on function public\.hook_allow_invited_staff\(jsonb\)[\s\S]*from anon, authenticated, public/);
  assert.match(inviteOnlySql, /create table public\.school_bootstraps/);
  assert.match(inviteOnlySql, /grant execute on function public\.create_school_bootstrap\(text, text, text, text\) to service_role/);
  assert.doesNotMatch(inviteOnlySql, /grant execute on function public\.create_school_bootstrap\(text, text, text, text\) to authenticated/);
  assert.match(inviteOnlySql, /grant execute on function public\.claim_school_bootstrap\(text\) to authenticated/);
});

test("den offentlige brugerflade viser kun signup via invitationslink", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.doesNotMatch(html, />Opret medarbejder</);
  assert.doesNotMatch(html, />Registrér skole</);
  assert.match(html, />Opret inviteret konto</);
  assert.match(app, /const accessParams = new URLSearchParams\(location\.search\)/);
  assert.match(app, /accessParams\.get\("invite"\)/);
  assert.match(app, /rememberStaffAccessFromUrl\(\);\s+await globalThis\.ElevsporSupabase\.signIn/);
  assert.match(app, /claimSchoolInvitation/);
});

test("elevadgang bruger engangskoder og tilbagekaldelige pseudonyme enheder", () => {
  assert.match(studentDeviceSql, /create table public\.student_access_grants/);
  assert.match(studentDeviceSql, /create table public\.student_devices/);
  assert.match(studentDeviceSql, /expires_at timestamptz not null default \(now\(\) \+ interval '15 minutes'\)/);
  assert.match(studentDeviceSql, /redeemed_at is null/);
  assert.match(studentDeviceSql, /grant execute on function public\.redeem_student_access\(text\) to anon, authenticated/);
  assert.match(studentDeviceSql, /revoked_at is null/);
  assert.match(studentDeviceSql, /access_grant\.student_id/);
  assert.doesNotMatch(studentDeviceSql, /\b(?:student_name|email|birth_year)\b/i);
});

test("elevens livscyklus adskiller enhed, deaktivering og permanent sletning", () => {
  assert.match(studentLifecycleSql, /create or replace function public\.list_student_devices/);
  assert.match(studentLifecycleSql, /create or replace function public\.set_student_active/);
  assert.match(studentLifecycleSql, /set revoked_at = coalesce\(revoked_at, now\(\)\)/);
  assert.match(studentLifecycleSql, /create or replace function public\.delete_student_permanently/);
  assert.match(studentLifecycleSql, /public\.is_school_admin\(target_school\)/);
  assert.match(studentLifecycleSql, /grant execute on function public\.set_student_active\(uuid, boolean\) to authenticated/);
  assert.doesNotMatch(studentLifecycleSql, /grant execute[\s\S]*delete_student_permanently\(uuid\) to anon/);
});

test("auditsporet oprettes server-side og gemmer ikke elevens navn", () => {
  assert.match(studentAuditSql, /create table public\.student_audit_events/);
  assert.match(studentAuditSql, /subject_student_id uuid not null/);
  assert.match(studentAuditSql, /actor_id uuid references auth\.users\(id\) on delete set null/);
  assert.match(studentAuditSql, /actor_name text not null/);
  assert.match(studentAuditSql, /create or replace function public\.list_student_audit_events/);
  assert.match(studentAuditSql, /'device_removed'/);
  assert.match(studentAuditSql, /'student_deactivated'/);
  assert.match(studentAuditSql, /'student_reactivated'/);
  assert.match(studentAuditSql, /'student_deleted'/);
  assert.match(studentAuditSql, /security definer/);
  assert.doesNotMatch(studentAuditSql, /\b(?:student_name|email|birth_year)\b/i);
  assert.doesNotMatch(studentAuditSql, /grant (?:select|insert|update|delete) on public\.student_audit_events to authenticated/i);
  assert.match(studentAuditOrderingSql, /order by e\.occurred_at desc, e\.id desc/);
});

test("skolens auditspor er adminbegrænset, filtrerbart og privat", () => {
  assert.match(schoolAuditSql, /create or replace function public\.list_school_audit_events/);
  assert.match(schoolAuditSql, /public\.is_school_admin\(target_school_id\)/);
  assert.match(schoolAuditSql, /filter_actor_id/);
  assert.match(schoolAuditSql, /filter_student_id/);
  assert.match(schoolAuditSql, /filter_action/);
  assert.match(schoolAuditSql, /filter_from/);
  assert.match(schoolAuditSql, /filter_to/);
  assert.doesNotMatch(schoolAuditSql, /\b(?:student_name|email|birth_year)\b/i);
});

test("owner- og administratorrettigheder kræver MFA-bekræftet AAL2", () => {
  assert.match(adminMfaSql, /create or replace function public\.is_school_admin/);
  assert.match(adminMfaSql, /auth\.jwt\(\) ->> 'aal'/);
  assert.match(adminMfaSql, /= 'aal2'/);
  assert.match(adminMfaSql, /sm\.role in \('owner', 'admin'\)/);
  assert.match(adminMfaSql, /revoke all on function public\.is_school_admin\(uuid\) from public, anon/);
  assert.match(adminMfaSql, /grant execute on function public\.is_school_admin\(uuid\) to authenticated/);
});

test("opbevaring og manuel purge er skoleafgrænset og kræver AAL2", () => {
  assert.match(retentionSql, /data_retention_days integer not null default 365/);
  assert.match(retentionSql, /data_retention_days between 30 and 2190/);
  assert.match(retentionSql, /create or replace function public\.purge_school_expired_data/);
  assert.match(retentionSql, /public\.is_school_admin\(target_school_id\)/);
  assert.match(retentionSql, /delete from public\.student_activities/);
  assert.match(retentionSql, /delete from public\.student_access_grants/);
  assert.match(retentionSql, /delete from public\.student_devices/);
  assert.match(retentionSql, /delete from public\.student_audit_events/);
  assert.match(retentionSql, /create table public\.data_purge_runs/);
  assert.match(retentionSql, /insert into public\.data_purge_runs/);
  assert.match(retentionSql, /never pupil identifiers/);
  assert.doesNotMatch(retentionSql, /cron\.schedule|pg_cron/);
});

test("elevindsigt og berigtigelse sker gennem skoleafgrænsede RPC'er", () => {
  assert.match(retentionSql, /create or replace function public\.rectify_school_student/);
  assert.match(retentionSql, /create or replace function public\.export_school_student_data/);
  assert.match(retentionSql, /public\.is_school_member\(s\.school_id\)/);
  assert.match(retentionSql, /'student_rectified'/);
  assert.match(retentionSql, /'activities'/);
  assert.match(retentionSql, /'devices'/);
  assert.match(retentionSql, /'audit_events'/);
  assert.doesNotMatch(retentionSql, /token_hash|code_hash/);
  assert.doesNotMatch(retentionSql, /grant execute on function public\.(?:rectify_school_student|export_school_student_data)[^\n]* to anon/);
});
