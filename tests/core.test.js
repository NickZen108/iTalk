const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
  defaultLevels, topicProgress, updateRecords, createProgress, chronologicalAge, effectiveAge, rememberTopic,
  createCustomScenario, getInitiator, isConversationPassed, chooseReply,
  schoolPageFromHash, schoolHashForPage, studentIdentityLabel, adminOnboardingStorageKey,
  normalizeStudentAccessSecret, studentAccessErrorMessage, isTestSchool, testChecklistStorageKey
} = require("../app.js");
const fs = require("node:fs");
const path = require("node:path");

test("viser seneste udgivelsesdato og tidspunkt øverst", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
  assert.match(html, /Senest opdateret:/);
  assert.match(html, /<time datetime="[^"]+">[^<]+kl\.[^<]+<\/time>/);
  assert.match(css, /\.update-stamp\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/s);
  assert.match(css, /\.topbar\s*\{[^}]*top:\s*1\.85rem;/s);
  const buildScript = fs.readFileSync(path.join(__dirname, "..", "scripts", "build.js"), "utf8");
  assert.match(buildScript, /Europe\/Copenhagen/);
  assert.match(buildScript, /stampedIndex/);
});

test("offline-cache henter publicerede opdateringer fra nettet først", () => {
  const worker = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");
  assert.match(worker, /fetch\(event\.request, \{ cache: "no-cache" \}\)/);
  assert.doesNotMatch(worker, /cached \|\| fetch/);
});

test("har fem fiktive elever med alle otte sværhedsfaktorer", () => {
  assert.equal(STUDENTS.length, 5);
  assert.equal(FACTORS.length, 8);
  STUDENTS.forEach(student => {
    assert.ok(student.name);
    FACTORS.forEach(factor => assert.ok(student.levels[factor.id] >= 1 && student.levels[factor.id] <= 5));
  });
});

test("har relevante hverdagsscenarier med lokal dialog", () => {
  assert.ok(SCENARIOS.length >= 5);
  ["play", "directions", "clothes"].forEach(id => assert.ok(SCENARIOS.some(item => item.id === id)));
  SCENARIOS.forEach(item => {
    assert.ok(item.opening.length >= 3);
    assert.ok(item.replies.length >= 4);
    assert.ok(item.suggestions.length >= 3);
  });
});

test("sværhedsgrader begrænses og beskrives fra 1 til 5", () => {
  assert.equal(clampLevel(0), 1);
  assert.equal(clampLevel(9), 5);
  assert.match(describeFactor("mood", 1), /glad/);
  assert.match(describeFactor("mood", 5), /sur/);
  assert.match(describeFactor("duration", 5), /5 minutter/);
});

test("hvert samtaleemne starter på trin 1 og har egne rekorder", () => {
  const progress = createProgress(STUDENTS[0]);
  const play = topicProgress(progress, "play");
  assert.deepEqual(play.levels, defaultLevels());
  assert.deepEqual(play.records, defaultLevels());
  play.levels.speed = 4;
  play.records = updateRecords(play.records, play.levels);
  assert.equal(play.records.speed, 4);
  play.levels.speed = 2;
  assert.equal(play.levels.speed, 2);
  assert.equal(play.records.speed, 4);
  assert.equal(topicProgress(progress, "cafe").levels.speed, 1);
});

test("ny elevprogression kopierer profil og holder noter lokalt", () => {
  const progress = createProgress(STUDENTS[0]);
  assert.deepEqual(progress.topicProgress, {});
  assert.deepEqual(progress.notes, { status: "", wishes: "" });
});

test("initiativ og simulerede svar følger niveau og scenarie", () => {
  assert.equal(getInitiator(1), "ai");
  assert.equal(getInitiator(5), "student");
  const response = chooseReply(SCENARIOS[0], 0, { challenge: 1 }, "Skal vi lege?");
  assert.match(response, /forslag/);
  assert.match(chooseReply(SCENARIOS[0], 0, { challenge: 1 }, "Kan du gentage det?"), /enklere ord/);
  assert.match(chooseReply(SCENARIOS[0], 1, { challenge: 3 }, "Hvad betyder kompromis?"), /begge giver os lidt/);
  assert.match(chooseReply(SCENARIOS[2], 1, { challenge: 3 }, "Hvad koster trøjen?"), /249 kroner/);
  assert.match(chooseReply(SCENARIOS[3], 1, { challenge: 3 }, "Jeg kan ikke tåle mælk"), /havredrik/);
  assert.match(chooseReply(SCENARIOS[0], 1, { challenge: 3 }, "Nej, det har jeg ikke lyst til"), /helt okay/i);
  assert.match(chooseReply(SCENARIOS[0], 1, { challenge: 3 }, "Du er tarvelig hvis du ikke vil lege"), /ikke kaldes noget grimt/);
  assert.match(chooseReply(SCENARIOS[0], 1, { challenge: 3 }, "Lad os spille fodbold på taget med lærernes hoveder"), /ikke sikkert/);
  assert.match(chooseReply(SCENARIOS[0], 1, { challenge: 3 }, "Jeg er nervøs og vil ikke være med"), /føles tryg/);
});

test("talegenkendelse sender automatisk et færdigt svar", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(source, /heardFinalResult/);
  assert.match(source, /Svar modtaget ✓/);
  assert.match(source, /sendStudentMessage\(\)/);
});

test("offentlig forside tåler stemmeopdatering uden valgt elev", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(source, /function populateVoices\(\) \{\s+const progress = currentProgress\(\);\s+if \(!progress\) return;/);
  assert.match(source, /addEventListener\("voiceschanged", populateVoices\)/);
});

test("en samtale kræver både fuld tid og løbende elevsvar", () => {
  assert.equal(isConversationPassed({ remaining: 1, duration: 60, turns: 9 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 60, turns: 1 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 60, turns: 2 }), true);
  assert.equal(isConversationPassed({ remaining: 0, duration: 300, turns: 9 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 300, turns: 10 }), true);
});

test("resultatresuméet viser lærerens lokale elevnavn uden at sende det til backend", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const backend = fs.readFileSync(path.join(__dirname, "..", "src", "supabase-client.js"), "utf8");

  assert.match(html, /Resultatresumé til lærer/);
  assert.match(html, /id="result-student-name"/);
  assert.match(app, /resultStudentName\.textContent = `Elev: \$\{currentStudent\(\)\.name\}`/);
  assert.doesNotMatch(backend, /student_name|elevnavn/i);
});

test("alder kan tilpasses med en skjult mental override", () => {
  assert.equal(chronologicalAge(2016, 2026), 10);
  assert.equal(chronologicalAge(3000, 2026), null);
  assert.equal(effectiveAge({ birthYear: 2016, mentalAge: 7 }, 2026), 7);
  assert.equal(effectiveAge({ birthYear: 2016, mentalAge: "" }, 2026), 10);
});

test("seneste emner begrænses til fem og nye emner kan oprettes", () => {
  assert.deepEqual(rememberTopic(["a", "b", "c", "d", "e"], "c", 5), ["c", "a", "b", "d", "e"]);
  assert.deepEqual(rememberTopic(["a", "b", "c", "d", "e"], "f", 5), ["f", "a", "b", "c", "d"]);
  const scenario = createCustomScenario("Tage bussen", 8);
  assert.equal(scenario.title, "Tage bussen");
  assert.match(scenario.goal, /8 år/);
});

test("forsiden har ingen åben elevvælger og elever oprettes i lærerområdet", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.doesNotMatch(html, /id="student-select"/);
  assert.doesNotMatch(html, /Vælg en elev øverst/);
  assert.match(html, /id="school-dashboard-view"/);
  assert.match(html, /id="create-student-form"/);
  assert.match(html, /id="create-student-button"/);
  assert.match(app, /renderSchoolDashboard/);
  assert.match(app, /Opretter eleven sikkert/);
  assert.match(app, /er oprettet\. Godkend eleven under/);
});

test("elevadministration er opdelt i egne sider og prioriterer godkendelser", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /data-school-page="students"/);
  assert.match(html, /data-school-page="create-student"/);
  assert.match(html, /data-school-page="staff"/);
  assert.match(html, /id="pending-student-list"/);
  assert.match(html, /id="recent-student-list"/);
  assert.match(html, /id="all-student-list"/);
  assert.match(html, /id="student-search"/);
  assert.match(app, /pending\.forEach[\s\S]*approved\.slice\(0, 5\)[\s\S]*entries\.sort/);
  assert.match(app, /renderSchoolDashboard\("students", id\)/);
  assert.match(app, /new-student-highlight/);
});

test("indloggede medarbejdere kan ikke strande på forsiden", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /id="open-school-dashboard"[^>]*hidden[^>]*>Gå til lærerområdet/);
  assert.match(app, /if \(membership\) \{[\s\S]*openSchoolDashboard\.hidden = false;[\s\S]*await renderSchoolDashboard\(\)/);
  assert.match(app, /openSchoolDashboard\.addEventListener\("click"[\s\S]*await renderSchoolDashboard\(\)/);
  assert.match(app, /els\.home\.addEventListener\("click", async[\s\S]*if \(session\)[\s\S]*await renderSchoolDashboard\(\)/);
  assert.match(app, /showView\("welcome"\);[\s\S]*void refreshSchoolSession\(\);/);
  assert.doesNotMatch(app, /void refreshSchoolSession\(\);\s+showView\("welcome"\);/);
});

test("lærerområdets undersider har stabile URL'er", () => {
  assert.equal(schoolHashForPage("students"), "#/elever");
  assert.equal(schoolHashForPage("create-student"), "#/opret-elev");
  assert.equal(schoolHashForPage("staff"), "#/medarbejdere");
  assert.equal(schoolPageFromHash("#/elever"), "students");
  assert.equal(schoolPageFromHash("#/opret-elev/"), "create-student");
  assert.equal(schoolPageFromHash("#/medarbejdere"), "staff");
  assert.equal(schoolPageFromHash("#/ukendt"), "");

  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(app, /elevspor\.lastSchoolPage/);
  assert.match(app, /window\.addEventListener\("popstate"/);
  assert.match(app, /history\.pushState/);
  assert.match(app, /schoolPageFromHash\(location\.hash\)[\s\S]*elevspor\.lastSchoolPage/);
});

test("administrator får en genåbnelig førstegangs-guide til hele elevflowet", () => {
  assert.equal(
    adminOnboardingStorageKey("skole-1", "bruger-2"),
    "elevspor.adminOnboardingDismissed.skole-1.bruger-2"
  );
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /id="admin-onboarding"[^>]*hidden/);
  assert.match(html, /Opret og godkend eleven/);
  assert.match(html, /Opret elevadgang/);
  assert.match(html, /Test QR eller kode/);
  assert.match(html, /Se elevens aktivitet/);
  assert.match(html, /id="start-admin-onboarding"/);
  assert.match(html, /id="show-admin-onboarding"[^>]*hidden/);
  assert.match(app, /const canManageStaff = \["owner", "admin"\]\.includes\(membership\.role\)/);
  assert.match(app, /setAdminOnboardingVisible\(!store\.read\(onboardingKey, false\)\)/);
  assert.match(app, /store\.write\(storageKey, true\)/);
  assert.match(app, /showSchoolPage\("create-student"\)/);
  assert.match(app, /els\.newStudentName\.focus\(\)/);
});

test("lærerområdets sider forklarer næste handling og håndterer tomme resultater", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /Godkend nye elever først/);
  assert.match(html, /Eleven får ikke en mail eller konto/);
  assert.match(html, /Kendetegnet gør det sikkert at skelne elever med samme navn/);
  assert.match(html, /Kun inviterede arbejdsmails kan oprette en medarbejderkonto/);
  assert.match(html, /id="staff-invitation-empty"/);
  assert.match(html, /Skoleadministrator kun til personer/);
  assert.match(html, /<h2>Aktivitetslog<\/h2>/);
  assert.match(html, /Kun skoleadministratorer kan se loggen/);
  assert.match(html, /id="student-search-empty"[^>]*hidden/);
  assert.match(app, /Alt er behandlet — ingen elever venter på godkendelse/);
  assert.match(app, /Opret den første elev/);
  assert.match(app, /showSchoolPage\("create-student"\)/);
  assert.match(app, /Ingen ændringer matcher filtrene\. Nulstil filtrene/);
  assert.match(app, /Ingen administrative ændringer endnu\. Loggen udfyldes/);
  assert.match(app, /studentSearchEmpty\.hidden = !query \|\| visible > 0/);
  assert.match(app, /staffInvitationEmpty\.hidden = true/);
});

test("elever med samme navn kan skelnes uden at navnet bliver identitet", () => {
  assert.equal(
    studentIdentityLabel({ name: "Emma", localLabel: "4.A" }, 2014),
    "Emma · 4.A · 2014"
  );
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /id="new-student-label"/);
  assert.match(app, /sameNameStudents/);
  assert.match(app, /Der findes allerede en elev med navnet/);
  assert.match(app, /student\.id/);
});

test("elevadgang kan åbnes med QR, link eller kode", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /id="student-access-qr"/);
  assert.match(html, /id="student-access-link"/);
  assert.match(html, /id="generated-student-access-code"/);
  assert.match(html, /id="student-access-code"/);
  assert.match(app, /createStudentAccess/);
  assert.match(app, /redeemStudentAccessFromHash/);
  assert.match(app, /recordStudentDeviceActivity/);
  assert.match(app, /elevspor\.studentDevice/);
});

test("elevadgang har sikre og forståelige tilstande uden persondata i URL'en", () => {
  assert.equal(normalizeStudentAccessSecret("ab12-cd34-ef56"), "ab12cd34ef56");
  assert.match(studentAccessErrorMessage(new Error("Elevadgangen er ugyldig eller udløbet")), /ugyldig, udløbet eller allerede brugt/);
  assert.match(studentAccessErrorMessage(new Error("Failed to fetch")), /Forbindelsen til ElevSpor forsvandt/);
  assert.match(studentAccessErrorMessage(new Error("andet"), false), /Hvis koden derefter afvises/);
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(html, /QR, link eller kode/);
  assert.match(html, /aria-live="polite" aria-atomic="true"/);
  assert.match(html, /Fornavnet gemmes kun på denne enhed og sendes ikke i linket/);
  assert.match(app, /url\.hash = `\/elev-adgang\/\$\{access\.token\}`/);
  assert.doesNotMatch(app, /encodeStudentAccessProfile|decodeStudentAccessProfile/);
  assert.doesNotMatch(app, /elev-adgang\/\$\{access\.token\}\/\$\{profile\}/);
  assert.match(app, /Linket er ugyldigt/);
  assert.match(app, /Linket er klar\. Skriv dit fornavn/);
  assert.match(app, /Kontrollerer den sikre engangsadgang/);
  assert.match(app, /Adgangen er godkendt\. Åbner dit elevområde/);
  assert.match(app, /studentAccessCode\.value = ""/);
  assert.match(app, /Koden skal have 12 bogstaver eller tal/);
  assert.doesNotMatch(app, /console\.(?:log|error|warn).*studentAccess/i);
});

test("Test-Skole har et ikke-destruktivt testforløb med ærlige kontroller", () => {
  assert.equal(isTestSchool(" Test-Skole "), true);
  assert.equal(isTestSchool("Pilotskolen"), false);
  assert.equal(
    testChecklistStorageKey("skole-1", "admin-2"),
    "elevspor.testChecklistManual.skole-1.admin-2"
  );
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const client = fs.readFileSync(path.join(__dirname, "..", "src", "supabase-client.js"), "utf8");
  assert.match(html, /id="test-school-checklist"[^>]*hidden/);
  assert.match(html, /Gennemfør testforløb/);
  assert.match(html, /Automatiske kontroller læser kun den aktuelle tilstand/);
  assert.match(html, /disse to trin kræver dit blik/i);
  assert.match(html, /Manuelle flueben betyder kun/);
  assert.match(app, /canManageStaff && isTestSchool\(membership\.schools\?\.name\)/);
  assert.match(app, /entry\.student\.name\.trim\(\)\.toLocaleLowerCase\("da"\) === "test-elev"/);
  assert.match(app, /device => !device\.revoked_at/);
  assert.match(app, /item\.activity_type === "conversation_completed"/);
  assert.match(app, /Ingen status er antaget/);
  assert.match(app, /checklisten har ikke ændret data/);
  assert.match(client, /\.from\("student_activities"\)/);
  assert.match(client, /\.select\("student_id,activity_type,occurred_at"\)/);
  assert.doesNotMatch(app, /refreshTestChecklist[\s\S]{0,2500}(?:createStudentAccess|approveStudent|setStudentActive|deleteStudentPermanently)\(/);
});

test("Opdatér status genhenter enheder før Test-Skoles enhedskontrol", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const start = app.indexOf("async function refreshTestChecklist()");
  const end = app.indexOf("const AUDIT_ACTION_LABELS", start);
  const refresh = app.slice(start, end);
  const approvalFetch = refresh.indexOf("await globalThis.ElevsporSupabase.getStudentApproval(");
  const deviceFetch = refresh.indexOf("await globalThis.ElevsporSupabase.listStudentDevices(freshStudent.id)");
  const deviceCheck = refresh.indexOf("testEntry.devices.some(device => !device.revoked_at)");
  const activityFetch = refresh.indexOf("await globalThis.ElevsporSupabase.listStudentActivities(");

  assert.ok(approvalFetch >= 0, "statusknappen skal genhente elevens godkendelse");
  assert.ok(deviceFetch > approvalFetch, "enheder skal genhentes efter den friske elevstatus");
  assert.ok(deviceCheck > deviceFetch, "enhedskontrollen må ikke bruge den gamle cache");
  assert.ok(activityFetch > deviceCheck, "aktiviteter skal også hentes på ny efter enhedskontrollen");
  assert.match(refresh, /testEntry\.approval = \{ status: freshStatus, student: freshStudent \}/);
  assert.match(refresh, /testEntry\.devices = \["approved", "inactive"\]\.includes\(freshStatus\)/);
});

test("adgang, enheder, deaktivering og permanent sletning er tydeligt adskilt", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(app, /devicesButton\.textContent = "Adgang og historik"/);
  assert.doesNotMatch(app, /devicesButton\.textContent = `Enheder/);
  assert.match(app, /studentDevicesTitle\.textContent = `Aktive enheder \(\$\{activeDevices\.length\}\)`/);
  assert.match(html, /<p class="eyebrow">Adgang og historik<\/p>/);
  assert.match(app, /remove\.textContent = "Fjern enhed"/);
  assert.match(html, /id="toggle-student-active"/);
  assert.match(html, /id="delete-student-permanently"/);
  assert.match(html, /Slet elev permanent/);
  assert.match(app, /Deaktivér elev/);
  assert.match(app, /Genaktivér elev/);
  assert.match(app, /state\.canManageStaff/);
  assert.match(app, /confirmStudentDeletion\.value\.trim\(\)/);
  assert.match(app, /revokeStudentDevice/);
  assert.match(app, /setStudentActive/);
  assert.match(app, /deleteStudentPermanently/);
});

test("elevindstillinger viser et serverbaseret auditspor", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const client = fs.readFileSync(path.join(__dirname, "..", "src", "supabase-client.js"), "utf8");
  assert.match(html, /id="student-audit-list"/);
  assert.match(html, />Seneste ændringer</);
  assert.match(app, /device_removed: "Enhed fjernet"/);
  assert.match(app, /student_deactivated: "Elev deaktiveret"/);
  assert.match(app, /student_reactivated: "Elev genaktiveret"/);
  assert.match(app, /event\.actor_name/);
  assert.match(app, /event\.occurred_at/);
  assert.doesNotMatch(app, /innerHTML = `<strong>\$\{labels\[event\.action\]/);
  assert.doesNotMatch(app, /Auditsporet kunne ikke hentes:[^;]+innerHTML/s);
  assert.match(client, /list_student_audit_events/);
});

test("administrator har samlet skole-auditspor med filtre og CSV", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const client = fs.readFileSync(path.join(__dirname, "..", "src", "supabase-client.js"), "utf8");
  assert.match(html, /data-school-page="audit"/);
  assert.match(html, /id="audit-from"/);
  assert.match(html, /id="audit-actor"/);
  assert.match(html, /id="audit-student"/);
  assert.match(html, /id="audit-action"/);
  assert.match(html, /id="export-school-audit"/);
  assert.match(app, /Slettet eller ukendt elev/);
  assert.match(app, /textContent = `\$\{auditStudentLabel/);
  assert.match(app, /text\/csv;charset=utf-8/);
  assert.match(client, /list_school_audit_events/);
});
