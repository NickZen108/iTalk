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

test("CI kører web-, database- og RLS-testpakken før merge", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /supabase db reset/);
  assert.match(workflow, /supabase test db/);
  assert.ok(fs.existsSync(path.join(root, "supabase/tests/rls_isolation.test.sql")));
});
