const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
  defaultLevels, topicProgress, updateRecords, createProgress, chronologicalAge, effectiveAge, rememberTopic,
  createCustomScenario, getInitiator, isConversationPassed, chooseReply
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

test("en samtale kræver både fuld tid og løbende elevsvar", () => {
  assert.equal(isConversationPassed({ remaining: 1, duration: 60, turns: 9 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 60, turns: 1 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 60, turns: 2 }), true);
  assert.equal(isConversationPassed({ remaining: 0, duration: 300, turns: 9 }), false);
  assert.equal(isConversationPassed({ remaining: 0, duration: 300, turns: 10 }), true);
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
