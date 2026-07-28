import { createClient } from "@supabase/supabase-js";

const config = globalThis.ELEVSPOR_CONFIG || {};
const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
const client = configured
  ? createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

async function requireClient() {
  if (!client) throw new Error("Supabase er ikke konfigureret.");
  return client;
}

async function hashLocalReference(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function getSession() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function signUp(email, password) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const supabase = await requireClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function registerSchool(name) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("register_school", { school_name: name });
  if (error) throw error;
  return data;
}

async function getMembership() {
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("school_members")
    .select("school_id,role,display_name,schools(id,name,status)")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureStudent(localId, birthYear) {
  const supabase = await requireClient();
  const membership = await getMembership();
  if (!membership) throw new Error("Medarbejderen er ikke knyttet til en skole.");
  const session = await getSession();
  if (!session) throw new Error("Login kræves.");
  const localReferenceHash = await hashLocalReference(localId);
  const payload = {
    school_id: membership.school_id,
    local_reference_hash: localReferenceHash,
    birth_year: birthYear || null,
    created_by: session.user.id
  };
  const { data, error } = await supabase
    .from("students")
    .upsert(payload, { onConflict: "school_id,local_reference_hash" })
    .select("id,school_id,last_activity_at")
    .single();
  if (error) throw error;
  return data;
}

async function recordActivity(localId, activityType, durationSeconds, birthYear) {
  const supabase = await requireClient();
  const session = await getSession();
  if (!session) return null;
  const student = await ensureStudent(localId, birthYear);
  const { data, error } = await supabase
    .from("student_activities")
    .insert({
      school_id: student.school_id,
      student_id: student.id,
      activity_type: activityType,
      duration_seconds: durationSeconds ?? null,
      created_by: session.user.id
    })
    .select("id,occurred_at")
    .single();
  if (error) throw error;
  return data;
}

async function monthlyUsage(month) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("monthly_school_usage", {
    target_month: month || new Date().toISOString().slice(0, 10)
  });
  if (error) throw error;
  return data;
}

globalThis.ElevsporSupabase = {
  configured,
  client,
  getSession,
  signUp,
  signIn,
  signOut,
  registerSchool,
  getMembership,
  ensureStudent,
  recordActivity,
  monthlyUsage,
  hashLocalReference
};
