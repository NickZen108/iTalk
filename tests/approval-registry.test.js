const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260730120000_school_approval_registry.sql"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("outbox has an explicit minimal payload", () => {
  const table = migration.match(/create table public\.supplier_notification_outbox \(([\s\S]*?)\n\);/i)?.[1] || "";
  for (const field of ["customer_id", "app_version", "status", "approved_at", "review_at", "document_sha256"]) {
    assert.match(table, new RegExp(`\\b${field}\\b`));
  }
  for (const forbidden of ["student", "signer", "pdf", "notes", "url", "recipient", "school_id"]) {
    assert.doesNotMatch(table, new RegExp(`\\b${forbidden}\\b`, "i"));
  }
  assert.match(table, /blocked_no_provider/);
});

test("RPCs require AAL2 school admin and tables deny direct client access", () => {
  assert.ok((migration.match(/public\.is_school_admin\(target_school_id\)/g) || []).length >= 4);
  assert.match(migration, /create table public\.supplier_notification_settings/);
  assert.match(
    migration,
    /revoke all on public\.school_approvals, public\.supplier_notification_settings,[\s\S]*public\.supplier_notification_outbox from public, anon, authenticated/
  );
});

test("recipient API returns only configured boolean", () => {
  assert.match(migration, /returns table \(enabled boolean, recipient_configured boolean\)/);
  assert.doesNotMatch(migration, /returns table \([^)]*recipient text/i);
  assert.doesNotMatch(migration, /alter table public\.schools[\s\S]*supplier_notification_recipient/i);
});

test("admin UI includes registry and explicit notification choice", () => {
  for (const id of ["approval-document-type", "approval-document-version", "approval-status",
    "approval-review-date", "approval-role", "approval-archive-reference",
    "approval-document-hash", "supplier-notification-enabled"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
