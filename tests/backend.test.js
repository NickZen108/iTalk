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

test("elevtabellen gemmer ikke navn, email, foto eller samtaleindhold", () => {
  const studentTable = sql.match(
    /create table public\.students \(([\s\S]*?)\n\);/
  )[1];
  ["name", "email", "photo", "avatar", "conversation", "transcript", "notes"].forEach(
    (forbidden) => assert.doesNotMatch(studentTable, new RegExp(`\\b${forbidden}\\b`, "i"))
  );
  assert.match(studentTable, /local_reference_hash text not null/);
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
  assert.match(app, /claimSchoolInvitation/);
});
