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

async function getMfaStatus() {
  const supabase = await requireClient();
  const [{ data: factors, error: factorsError }, { data: assurance, error: assuranceError }] =
    await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    ]);
  if (factorsError) throw factorsError;
  if (assuranceError) throw assuranceError;
  return {
    currentLevel: assurance.currentLevel,
    nextLevel: assurance.nextLevel,
    verifiedFactors: factors.totp.filter(factor => factor.status === "verified"),
    unverifiedFactors: factors.totp.filter(factor => factor.status !== "verified")
  };
}

async function enrollMfa() {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Elevspor"
  });
  if (error) throw error;
  return data;
}

async function verifyMfa(factorId, code) {
  const supabase = await requireClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;
  const verification = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: String(code).replace(/\s/g, "")
  });
  if (verification.error) throw verification.error;
  return verification.data;
}

async function unenrollMfa(factorId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
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

async function ensureStudent(localId, birthYear, displayName = null) {
  const supabase = await requireClient();
  const session = await getSession();
  if (!session) throw new Error("Login kræves.");
  const localReferenceHash = await hashLocalReference(localId);
  const { data, error } = await supabase.rpc("ensure_school_student", {
    local_reference_hash: localReferenceHash,
    student_birth_year: birthYear || null,
    student_display_name: displayName?.trim() || null
  });
  if (error) throw error;
  return data;
}

async function getStudentApproval(localId, birthYear, displayName = null) {
  return ensureStudent(localId, birthYear, displayName);
}

async function listSchoolStudents() {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("list_school_students");
  if (error) throw error;
  return data || [];
}

async function recordStaffStudentActivity(studentId, activityType, durationSeconds) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("record_staff_student_activity", {
    target_student_id: studentId,
    requested_activity_type: activityType,
    requested_duration_seconds: durationSeconds ?? null
  });
  if (error) throw error;
  return data;
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

async function rectifyStudent(studentId, displayName) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("rectify_school_student", {
    target_student_id: studentId,
    requested_display_name: displayName.trim()
  });
  if (error) throw error;
  return data;
}

async function exportStudentData(studentId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("export_school_student_data", {
    target_student_id: studentId
  });
  if (error) throw error;
  return data;
}

async function getRetentionSettings(schoolId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("get_school_retention_settings", {
    target_school_id: schoolId
  });
  if (error) throw error;
  return data?.[0] || null;
}

async function setRetentionDays(schoolId, days) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("set_school_retention_days", {
    target_school_id: schoolId,
    requested_days: days
  });
  if (error) throw error;
  return data;
}

async function purgeExpiredSchoolData(schoolId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("purge_school_expired_data", {
    target_school_id: schoolId
  });
  if (error) throw error;
  return data;
}

async function getSchoolApprovalRegistry(schoolId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("get_school_approval_registry", {
    target_school_id: schoolId
  });
  if (error) throw error;
  return data || [];
}

async function getSupplierNotificationSetting(schoolId) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("get_supplier_notification_setting", {
    target_school_id: schoolId
  });
  if (error) throw error;
  return data?.[0] || null;
}

async function setSupplierNotificationSetting(schoolId, enabled, recipient = null) {
  const supabase = await requireClient();
  const { error } = await supabase.rpc("set_supplier_notification_setting", {
    target_school_id: schoolId,
    requested_enabled: Boolean(enabled),
    requested_recipient: recipient || null
  });
  if (error) throw error;
}

async function saveSchoolApproval(schoolId, approval) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("save_school_approval", {
    target_school_id: schoolId,
    requested_document_type: approval.documentType,
    requested_document_version: approval.documentVersion,
    requested_status: approval.status,
    requested_approved_at: approval.status === "approved" ? approval.approvedAt : null,
    requested_review_at: approval.reviewAt,
    requested_approver_role: approval.approverRole,
    requested_archive_reference: approval.archiveReference,
    requested_document_sha256: approval.documentSha256,
    requested_app_version: approval.appVersion
  });
  if (error) throw error;
  return data;
}

async function listStudentAuditEvents(studentId, limit = 20) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("list_student_audit_events", {
    target_student_id: studentId,
    result_limit: limit
  });
  if (error) throw error;
  return data;
}

async function listSchoolAuditEvents(schoolId, filters = {}) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("list_school_audit_events", {
    target_school_id: schoolId,
    result_limit: filters.limit || 500,
    filter_from: filters.from || null,
    filter_to: filters.to || null,
    filter_actor_id: filters.actorId || null,
    filter_student_id: filters.studentId || null,
    filter_action: filters.action || null
  });
  if (error) throw error;
  return data;
}

async function listStudentActivities(studentIds) {
  const ids = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];
  if (!ids.length) return [];
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("student_activities")
    .select("student_id,activity_type,occurred_at")
    .in("student_id", ids)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

async function recordActivity(localId, activityType, durationSeconds, birthYear, displayName = null) {
  const supabase = await requireClient();
  const session = await getSession();
  if (!session) return null;
  const student = await ensureStudent(localId, birthYear, displayName);
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
  getMfaStatus,
  enrollMfa,
  verifyMfa,
  unenrollMfa,
  registerSchool,
  getMembership,
  ensureStudent,
  getStudentApproval,
  listSchoolStudents,
  recordStaffStudentActivity,
  approveStudent,
  createStudentAccess,
  redeemStudentAccess,
  getStudentDeviceStatus,
  recordStudentDeviceActivity,
  listStudentDevices,
  revokeStudentDevice,
  setStudentActive,
  deleteStudentPermanently,
  rectifyStudent,
  exportStudentData,
  getRetentionSettings,
  setRetentionDays,
  purgeExpiredSchoolData,
  getSchoolApprovalRegistry,
  getSupplierNotificationSetting,
  setSupplierNotificationSetting,
  saveSchoolApproval,
  listStudentAuditEvents,
  listSchoolAuditEvents,
  listStudentActivities,
  recordActivity,
  monthlyUsage,
  hashLocalReference
};
