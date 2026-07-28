const test = require("node:test");
const assert = require("node:assert/strict");
const { CATEGORIES, DEFAULT_CARDS, normalizeCard, appendMessage } = require("../app.js");

test("har centrale AAC-kategorier og standardkort", () => {
  assert.ok(CATEGORIES.length >= 5);
  assert.ok(DEFAULT_CARDS.some(card => card.text.includes("hjælp")));
  assert.ok(DEFAULT_CARDS.some(card => card.text.includes("Stop")));
  assert.ok(DEFAULT_CARDS.some(card => card.text.includes("pause")));
});

test("normaliserer et brugerdefineret kort sikkert", () => {
  const card = normalizeCard(
    { text: "  Ring til mor  ", symbol: "", category: "ukendt" },
    () => "custom-1"
  );
  assert.deepEqual(card, {
    id: "custom-1",
    category: "mine",
    symbol: "💬",
    text: "Ring til mor",
    custom: true
  });
});

test("afviser tomme kort", () => {
  assert.throws(() => normalizeCard({ text: " " }, () => "x"), /tekst/);
});

test("sammensætter og begrænser beskeder", () => {
  assert.equal(appendMessage("Jeg vil", "gerne hjem"), "Jeg vil gerne hjem");
  assert.equal(appendMessage("", "Ja"), "Ja");
  assert.equal(appendMessage("x".repeat(239), "lang"), "x".repeat(239) + " ");
  assert.equal(appendMessage("x".repeat(239), "lang").length, 240);
});
