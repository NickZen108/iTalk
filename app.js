(function (root) {
  "use strict";

  const CATEGORIES = [
    { id: "quick", label: "Hurtigt" },
    { id: "feelings", label: "Følelser" },
    { id: "food", label: "Mad og drikke" },
    { id: "activities", label: "Aktiviteter" },
    { id: "mine", label: "Mine kort" }
  ];

  const DEFAULT_CARDS = [
    { id: "yes", category: "quick", symbol: "👍", text: "Ja" },
    { id: "no", category: "quick", symbol: "✋", text: "Nej" },
    { id: "help", category: "quick", symbol: "🆘", text: "Jeg har brug for hjælp" },
    { id: "pause", category: "quick", symbol: "⏸️", text: "Jeg har brug for en pause" },
    { id: "stop", category: "quick", symbol: "🛑", text: "Stop, tak" },
    { id: "understand", category: "quick", symbol: "❓", text: "Jeg forstår det ikke" },
    { id: "happy", category: "feelings", symbol: "🙂", text: "Jeg er glad" },
    { id: "sad", category: "feelings", symbol: "😔", text: "Jeg er ked af det" },
    { id: "overwhelmed", category: "feelings", symbol: "🌊", text: "Jeg er overvældet" },
    { id: "worried", category: "feelings", symbol: "😟", text: "Jeg er urolig" },
    { id: "pain", category: "feelings", symbol: "🤕", text: "Jeg har ondt" },
    { id: "quiet", category: "feelings", symbol: "🔇", text: "Jeg har brug for ro" },
    { id: "water", category: "food", symbol: "💧", text: "Jeg vil gerne have vand" },
    { id: "hungry", category: "food", symbol: "🍽️", text: "Jeg er sulten" },
    { id: "not-hungry", category: "food", symbol: "🙅", text: "Jeg er ikke sulten" },
    { id: "choose-food", category: "food", symbol: "📋", text: "Vis mig mulighederne" },
    { id: "home", category: "activities", symbol: "🏠", text: "Jeg vil gerne hjem" },
    { id: "outside", category: "activities", symbol: "🌳", text: "Jeg vil gerne udenfor" },
    { id: "music", category: "activities", symbol: "🎧", text: "Jeg vil høre musik" },
    { id: "alone", category: "activities", symbol: "🧘", text: "Jeg vil gerne være alene" }
  ];

  function normalizeCard(input, idFactory) {
    const text = String(input && input.text || "").trim().slice(0, 80);
    if (!text) throw new Error("Kortet skal have en tekst");
    const allowed = new Set(CATEGORIES.map(category => category.id));
    const category = allowed.has(input.category) ? input.category : "mine";
    return {
      id: input.id || idFactory(),
      category,
      symbol: String(input.symbol || "💬").trim().slice(0, 4) || "💬",
      text,
      custom: true
    };
  }

  function appendMessage(current, phrase) {
    const cleanCurrent = String(current || "").trim();
    const cleanPhrase = String(phrase || "").trim();
    if (!cleanCurrent) return cleanPhrase;
    if (!cleanPhrase) return cleanCurrent;
    return `${cleanCurrent} ${cleanPhrase}`.slice(0, 240);
  }

  const api = { CATEGORIES, DEFAULT_CARDS, normalizeCard, appendMessage };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.iTalkCore = api;

  if (typeof document === "undefined") return;

  const storage = {
    read(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
  };

  const state = {
    category: storage.read("italk.category", "quick"),
    customCards: storage.read("italk.cards", []),
    calm: storage.read("italk.calm", false)
  };

  const els = {
    categories: document.querySelector("#categories"),
    cards: document.querySelector("#cards"),
    cardsTitle: document.querySelector("#cards-title"),
    template: document.querySelector("#card-template"),
    message: document.querySelector("#message"),
    speak: document.querySelector("#speak-message"),
    clear: document.querySelector("#clear-message"),
    status: document.querySelector("#speech-status"),
    calm: document.querySelector("#calm-toggle"),
    empty: document.querySelector("#empty-state"),
    dialog: document.querySelector("#add-dialog"),
    addForm: document.querySelector("#add-form"),
    openAdd: document.querySelector("#open-add"),
    closeAdd: document.querySelector("#close-add"),
    cancelAdd: document.querySelector("#cancel-add"),
    cardText: document.querySelector("#card-text"),
    cardSymbol: document.querySelector("#card-symbol"),
    cardCategory: document.querySelector("#card-category")
  };

  function speak(text) {
    const phrase = String(text || "").trim();
    if (!phrase) {
      els.status.textContent = "Vælg eller skriv først en besked.";
      return;
    }
    if (!("speechSynthesis" in window)) {
      els.status.textContent = "Oplæsning understøttes ikke på denne enhed.";
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "da-DK";
    utterance.rate = .92;
    utterance.onstart = () => { els.status.textContent = "Taler…"; };
    utterance.onend = () => { els.status.textContent = ""; };
    utterance.onerror = () => { els.status.textContent = "Kunne ikke læse beskeden op."; };
    window.speechSynthesis.speak(utterance);
  }

  function allCards() {
    const custom = Array.isArray(state.customCards) ? state.customCards : [];
    return DEFAULT_CARDS.concat(custom);
  }

  function renderCategories() {
    els.categories.replaceChildren();
    CATEGORIES.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category";
      button.textContent = category.label;
      button.setAttribute("aria-pressed", String(state.category === category.id));
      button.addEventListener("click", () => {
        state.category = category.id;
        storage.write("italk.category", state.category);
        renderCategories();
        renderCards();
      });
      els.categories.append(button);
    });
  }

  function renderCards() {
    const category = CATEGORIES.find(item => item.id === state.category) || CATEGORIES[0];
    const visible = allCards().filter(card =>
      state.category === "mine" ? card.custom : card.category === state.category
    );
    els.cardsTitle.textContent = category.label;
    els.cards.replaceChildren();
    els.empty.hidden = visible.length > 0;
    visible.forEach(card => {
      const node = els.template.content.cloneNode(true);
      const article = node.querySelector(".phrase-card");
      const main = node.querySelector(".card-main");
      const remove = node.querySelector(".delete-card");
      node.querySelector(".card-symbol").textContent = card.symbol;
      node.querySelector(".card-text").textContent = card.text;
      main.setAttribute("aria-label", `Tilføj og sig: ${card.text}`);
      main.addEventListener("click", () => {
        els.message.value = appendMessage(els.message.value, card.text);
        speak(card.text);
      });
      if (card.custom) {
        remove.hidden = false;
        remove.setAttribute("aria-label", `Slet kortet ${card.text}`);
        remove.addEventListener("click", () => {
          if (!window.confirm(`Slet kortet “${card.text}”?`)) return;
          state.customCards = state.customCards.filter(item => item.id !== card.id);
          storage.write("italk.cards", state.customCards);
          renderCards();
        });
      }
      article.dataset.cardId = card.id;
      els.cards.append(node);
    });
  }

  function setCalm(value) {
    state.calm = Boolean(value);
    document.body.classList.toggle("calm", state.calm);
    els.calm.setAttribute("aria-pressed", String(state.calm));
    els.calm.querySelector("span:last-child").textContent = state.calm ? "Rolig til" : "Rolig";
    storage.write("italk.calm", state.calm);
  }

  CATEGORIES.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id === "mine" ? "mine" : category.id;
    option.textContent = category.label;
    els.cardCategory.append(option);
  });

  els.speak.addEventListener("click", () => speak(els.message.value));
  els.clear.addEventListener("click", () => { els.message.value = ""; els.status.textContent = ""; els.message.focus(); });
  els.calm.addEventListener("click", () => setCalm(!state.calm));
  els.openAdd.addEventListener("click", () => { els.cardCategory.value = state.category; els.dialog.showModal(); els.cardText.focus(); });
  els.closeAdd.addEventListener("click", () => els.dialog.close());
  els.cancelAdd.addEventListener("click", () => els.dialog.close());
  els.addForm.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const card = normalizeCard({
        text: els.cardText.value,
        symbol: els.cardSymbol.value,
        category: els.cardCategory.value
      }, () => `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      state.customCards.push(card);
      storage.write("italk.cards", state.customCards);
      state.category = card.category === "mine" ? "mine" : card.category;
      storage.write("italk.category", state.category);
      els.addForm.reset();
      els.dialog.close();
      renderCategories();
      renderCards();
    } catch (error) {
      els.cardText.setCustomValidity(error.message);
      els.cardText.reportValidity();
      els.cardText.setCustomValidity("");
    }
  });

  setCalm(state.calm);
  renderCategories();
  renderCards();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
