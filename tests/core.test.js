const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
  calculateHero, createProgress, chronologicalAge, effectiveAge, rememberTopic,
  createCustomScenario, getInitiator, isConversationPassed, chooseReply
} = require("../app.js");

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

test("Hero-score kombinerer faktorniveauer og beståede opgaver", () => {
  const low = Object.fromEntries(FACTORS.map(factor => [factor.id, 1]));
  const high = Object.fromEntries(FACTORS.map(factor => [factor.id, 5]));
  assert.equal(calculateHero(low, 0), 18);
  assert.equal(calculateHero(high, 9), 100);
  assert.ok(calculateHero(low, 3) > calculateHero(low, 0));
});

test("ny elevprogression kopierer profil og holder noter lokalt", () => {
  const progress = createProgress(STUDENTS[0]);
  assert.deepEqual(progress.levels, STUDENTS[0].levels);
  assert.notEqual(progress.levels, STUDENTS[0].levels);
  assert.deepEqual(progress.notes, { status: "", wishes: "" });
});

test("initiativ og simulerede svar følger niveau og scenarie", () => {
  assert.equal(getInitiator(1), "ai");
  assert.equal(getInitiator(5), "student");
  const response = chooseReply(SCENARIOS[0], 0, { challenge: 1 }, "Skal vi lege?");
  assert.ok(SCENARIOS[0].replies.includes(response));
  assert.match(chooseReply(SCENARIOS[0], 0, { challenge: 1 }, "Kan du gentage det?"), /anden måde/);
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
