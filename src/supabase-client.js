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

async function signUp(email, password, displayName) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined
  });
  if (error) throw error;
  return data;
}

async function createSchoolInvitation(schoolId, email, role = "teacher") {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("create_school_invitation", {
    target_school_id: schoolId,
    invite_email: email,
    invite_role: role
  });
  if (error) throw error;
  return data;
}

async function claimSchoolInvitation(token) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("claim_school_invitation", {
    raw_token: token
  });
  if (error) throw error;
  return data;
}

async function claimSchoolBootstrap(token) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("claim_school_bootstrap", {
    raw_token: token
  });
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
  const session = await getSession();
  if (!session) throw new Error("Login kræves.");
  const localReferenceHash = await hashLocalReference(localId);
  const { data, error } = await supabase.rpc("ensure_school_student", {
    local_reference_hash: localReferenceHash,
    student_birth_year: birthYear || null
  });
  if (error) throw error;
  return data;
}

async function getStudentApproval(localId, birthYear) {
  return ensureStudent(localId, birthYear);
}

async function approveStudent(studentId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("approve_student", {
    target_student_id: studentId
  });
  if (error) throw error;
  return data;
}

async function createStudentAccess(studentId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("create_student_access", {
    target_student_id: studentId
  });
  if (error) throw error;
  return data;
}

async function redeemStudentAccess(secret) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("redeem_student_access", {
    access_secret: secret
  });
  if (error) throw error;
  return data;
}

async function getStudentDeviceStatus(deviceToken) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("student_device_status", {
    device_token: deviceToken
  });
  if (error) throw error;
  return data;
}

async function recordStudentDeviceActivity(deviceToken, activityType, durationSeconds) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("record_student_device_activity", {
    device_token: deviceToken,
    requested_activity_type: activityType,
    requested_duration_seconds: durationSeconds ?? null
  });
  if (error) throw error;
  return data;
}

async function listStudentDevices(studentId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("list_student_devices", {
    target_student_id: studentId
  });
  if (error) throw error;
  return data;
}

async function revokeStudentDevice(deviceId) {
  const supabase = await requireClient();
  const { error } = await supabase.rpc("revoke_student_device", {
    target_device_id: deviceId
  });
  if (error) throw error;
}

async function setStudentActive(studentId, active) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("set_student_active", {
    target_student_id: studentId,
    requested_active: active
  });
  if (error) throw error;
  return data;
}

async function deleteStudentPermanently(studentId) {
  const supabase = await requireClient();
  const { error } = await supabase.rpc("delete_student_permanently", {
    target_student_id: studentId
  });
  if (error) throw error;
}

async function recordActivity(localId, activityType, durationSeconds, birthYear) {
  const supabase = await requireClient();
  const session = await getSession();
  if (!session) return null;
  const student = await ensureStudent(localId, birthYear);
  if (student.approval_status !== "approved") {
    const error = new Error("Eleven afventer lærerens godkendelse.");
    error.code = "STUDENT_APPROVAL_REQUIRED";
    throw error;
  }
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
  createSchoolInvitation,
  claimSchoolInvitation,
  claimSchoolBootstrap,
  signIn,
  signOut,
  registerSchool,
  getMembership,
  ensureStudent,
  getStudentApproval,
  approveStudent,
  createStudentAccess,
  redeemStudentAccess,
  getStudentDeviceStatus,
  recordStudentDeviceActivity,
  listStudentDevices,
  revokeStudentDevice,
  setStudentActive,
  deleteStudentPermanently,
  recordActivity,
  monthlyUsage,
  hashLocalReference
};
