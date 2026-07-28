(function (root) {
  "use strict";

  const FACTORS = [
    { id: "initiative", label: "Første initiativ", icon: "🙋" },
    { id: "warmth", label: "AI’ens imødekommenhed", icon: "🤝" },
    { id: "extroversion", label: "AI’ens personlighed", icon: "🎭" },
    { id: "mood", label: "AI’ens humør", icon: "🙂" },
    { id: "noise", label: "Baggrundsstøj", icon: "🔊" },
    { id: "challenge", label: "Modspørgsmål", icon: "↔️" },
    { id: "speed", label: "Talehastighed", icon: "⏩" },
    { id: "duration", label: "Samtalelængde", icon: "⏱️" }
  ];

  const STUDENTS = [
    {
      id: "alma", name: "Alma", avatar: "🦊",
      profile: "Tryg ved kendte emner og øver selv at åbne samtalen.",
      levels: { initiative: 2, warmth: 1, extroversion: 1, mood: 1, noise: 1, challenge: 1, speed: 2, duration: 1 }
    },
    {
      id: "malik", name: "Malik", avatar: "🦁",
      profile: "God til konkrete spørgsmål og træner uventede svar.",
      levels: { initiative: 3, warmth: 2, extroversion: 2, mood: 2, noise: 2, challenge: 3, speed: 2, duration: 2 }
    },
    {
      id: "freja", name: "Freja", avatar: "🐼",
      profile: "Holder gode samtaler og arbejder med støj og tempo.",
      levels: { initiative: 3, warmth: 3, extroversion: 3, mood: 2, noise: 4, challenge: 2, speed: 4, duration: 3 }
    },
    {
      id: "noah", name: "Noah", avatar: "🐯",
      profile: "Tager ofte initiativ og øver modargumenter.",
      levels: { initiative: 4, warmth: 3, extroversion: 4, mood: 3, noise: 3, challenge: 4, speed: 3, duration: 4 }
    },
    {
      id: "sofie", name: "Sofie", avatar: "🦄",
      profile: "Er klar til komplekse, længere hverdagssamtaler.",
      levels: { initiative: 5, warmth: 5, extroversion: 5, mood: 4, noise: 4, challenge: 5, speed: 4, duration: 5 }
    }
  ];

  const SCENARIOS = [
    {
      id: "play", icon: "⚽", title: "Hvad skal vi lege?",
      goal: "Bliv enige med en klassekammerat om en aktivitet.",
      aiName: "klassekammeraten Alex",
      suggestions: ["Hvad har du lyst til at lege?", "Skal vi spille bold?", "Vi kan skiftes til at vælge."],
      opening: ["Hej! Jeg vil gerne lave noget i pausen. Hvad tænker du?", "Skal vi finde på noget at lege?", "Jeg havde tænkt på fangeleg. Hvad vil du?"],
      replies: [
        "Det kunne vi godt. Hvad er det sjoveste ved det?",
        "Jeg havde faktisk mere lyst til noget andet. Kan vi finde et kompromis?",
        "Okay, men hvem skal ellers være med?",
        "God idé. Hvor skal vi gøre det?"
      ]
    },
    {
      id: "directions", icon: "🗺️", title: "Spørg om vej",
      goal: "Find vej til biblioteket ved at stille tydelige spørgsmål.",
      aiName: "en person på gaden",
      suggestions: ["Undskyld, hvor ligger biblioteket?", "Skal jeg dreje til højre?", "Hvor lang tid tager det at gå?"],
      opening: ["Hej, ser du ud som om du leder efter noget?", "Kan jeg hjælpe dig med at finde vej?", "Hej. Hvor skal du hen?"],
      replies: [
        "Du skal fortsætte ligeud. Ved du, hvor lyskrydset er?",
        "Drej til højre efter bageren. Vil du have det gentaget?",
        "Det tager cirka fem minutter. Er du til fods?",
        "Jeg er ikke helt sikker på husnummeret. Hvad kan du ellers spørge om?"
      ]
    },
    {
      id: "clothes", icon: "👕", title: "Køb tøj",
      goal: "Spørg en ekspedient om pris, størrelse og muligheder.",
      aiName: "ekspedienten Sam",
      suggestions: ["Hvad koster trøjen?", "Har I den i en anden størrelse?", "Må jeg prøve den?"],
      opening: ["Hej og velkommen. Sig til, hvis du skal bruge hjælp.", "Leder du efter noget bestemt?", "Den trøje findes i flere farver. Skal jeg hjælpe?"],
      replies: [
        "Den koster 249 kroner. Hvilken størrelse bruger du?",
        "Jeg kan tjekke lageret. Er en anden farve også interessant?",
        "Prøverummet er derovre. Vil du prøve en størrelse større også?",
        "Vi har desværre ikke den blå. Hvad tænker du om den grønne?"
      ]
    },
    {
      id: "cafe", icon: "🥤", title: "Bestil på en café",
      goal: "Bestil noget og håndtér et opklarende spørgsmål.",
      aiName: "medarbejderen Kim",
      suggestions: ["Jeg vil gerne bestille en kakao.", "Hvad koster den?", "Uden flødeskum, tak."],
      opening: ["Hej, hvad kan jeg hjælpe med?", "Er du klar til at bestille?", "Goddag. Hvad kunne du tænke dig?"],
      replies: [
        "Vil du have den lille eller den store?",
        "Det kan vi godt. Skal den være varm eller kold?",
        "Det bliver 38 kroner. Betaler du med kort?",
        "Den er vi løbet tør for. Vil du vælge noget andet?"
      ]
    },
    {
      id: "group", icon: "🧩", title: "Kom med i gruppen",
      goal: "Spørg om at være med og find din rolle i aktiviteten.",
      aiName: "gruppelederen Robin",
      suggestions: ["Må jeg være med?", "Hvad er I i gang med?", "Hvad kan jeg hjælpe med?"],
      opening: ["Hej. Vi bygger en bane. Vil du høre om den?", "Vi mangler faktisk en, der kan hjælpe. Har du lyst?", "Kender du reglerne til det her spil?"],
      replies: [
        "Ja, du må gerne være med. Hvad vil du helst hjælpe med?",
        "Vi er næsten færdige, men du kan stadig få en opgave. Er det okay?",
        "Vi gør det på en bestemt måde. Vil du prøve vores idé først?",
        "Godt spørgsmål. Hvad synes du selv ville være en god rolle?"
      ]
    }
  ];

  function clampLevel(value) {
    return Math.max(1, Math.min(5, Number(value) || 1));
  }

  function describeFactor(id, level) {
    const n = clampLevel(level);
    const descriptions = {
      initiative: ["AI starter samtalen", "AI hjælper samtalen i gang", "I skiftes til at starte", "Eleven starter oftest", "Eleven starter selv"],
      warmth: ["Meget imødekommende (5/5)", "Imødekommende (4/5)", "Neutral (3/5)", "Reserveret (2/5)", "Afvisende (1/5)"],
      extroversion: ["Meget introvert", "Introvert", "Blandet", "Ekstrovert", "Meget ekstrovert"],
      mood: ["Meget glad (5/5)", "Glad (4/5)", "Neutral (3/5)", "Irriteret (2/5)", "Meget sur (1/5)"],
      noise: ["Helt stille", "Lidt baggrundslyd", "Almindelig støj", "Meget støj", "Kraftig støj"],
      challenge: ["Ingen modspørgsmål", "Enkle spørgsmål", "Nogle modspørgsmål", "Modargumenterer", "Udfordrer ofte"],
      speed: ["Meget langsomt", "Langsomt", "Normalt tempo", "Hurtigt", "Meget hurtigt"],
      duration: ["1 minut", "2 minutter", "3 minutter", "4 minutter", "5 minutter"]
    };
    return descriptions[id][n - 1];
  }

  function calculateHero(levels, completedCount) {
    const values = FACTORS.map(factor => clampLevel(levels[factor.id]));
    const mastery = values.reduce((sum, value) => sum + value, 0) / (values.length * 5);
    const practiceBonus = Math.min(10, Math.max(0, Number(completedCount) || 0) * 2);
    return Math.min(100, Math.round(mastery * 90 + practiceBonus));
  }

  function createProgress(student) {
    return {
      levels: Object.assign({}, student.levels),
      completed: [],
      attempts: 0,
      voice: "",
      birthYear: "",
      mentalAge: "",
      recentTopics: SCENARIOS.map(item => item.id),
      customTopics: [],
      notes: { status: "", wishes: "" }
    };
  }

  function chronologicalAge(birthYear, year) {
    const born = Number(birthYear);
    const now = Number(year) || new Date().getFullYear();
    return Number.isInteger(born) && born >= now - 100 && born <= now ? now - born : null;
  }

  function effectiveAge(progress, year) {
    const override = Number(progress && progress.mentalAge);
    if (Number.isInteger(override) && override >= 2 && override <= 100) return override;
    return chronologicalAge(progress && progress.birthYear, year);
  }

  function rememberTopic(recentTopics, id, limit) {
    const clean = (Array.isArray(recentTopics) ? recentTopics : []).filter(item => item !== id);
    return [id, ...clean].slice(0, limit || 5);
  }

  function createCustomScenario(title, age) {
    const cleanTitle = String(title || "").trim().slice(0, 80);
    if (!cleanTitle) return null;
    const ageHint = age ? ` Samtalen tilpasses et udviklingsniveau omkring ${age} år.` : "";
    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      icon: "💬", title: cleanTitle,
      goal: `Øv en tryg samtale om ${cleanTitle.toLowerCase()}.${ageHint}`,
      aiName: "samtalepartneren",
      suggestions: [`Vil du tale om ${cleanTitle.toLowerCase()}?`, "Hvad tænker du om det?", "Kan du fortælle lidt mere?"],
      opening: [`Hej! Skal vi tale om ${cleanTitle.toLowerCase()}?`, `Hvad synes du er interessant ved ${cleanTitle.toLowerCase()}?`, `Fortæl mig gerne noget om ${cleanTitle.toLowerCase()}.`],
      replies: ["Det er interessant. Kan du fortælle lidt mere?", "Hvad synes du selv om det?", "Okay. Hvad skete der så?", "Godt fortalt. Er der noget, du vil spørge mig om?"]
    };
  }

  function getInitiator(level) {
    return clampLevel(level) >= 4 ? "student" : "ai";
  }

  function isConversationPassed(session) {
    if (!session || session.remaining > 0) return false;
    const requiredTurns = Math.max(2, Math.round(session.duration / 30));
    return session.turns >= requiredTurns;
  }

  function chooseReply(scenario, turn, levels, input) {
    const clean = String(input || "").toLowerCase();
    if (/tak|farvel|hej hej/.test(clean)) return "Selv tak. Er der noget mere, du vil spørge om?";
    if (/forstår ikke|gentag|igen/.test(clean)) return "Selvfølgelig. Jeg siger det på en anden måde. Hvad vil du gerne have uddybet?";
    const challenge = clampLevel(levels.challenge);
    const index = challenge >= 4 ? (turn + 1) % scenario.replies.length : turn % scenario.replies.length;
    return scenario.replies[index];
  }

  const api = {
    FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
    calculateHero, createProgress, chronologicalAge, effectiveAge, rememberTopic,
    createCustomScenario, getInitiator, isConversationPassed, chooseReply
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.iTalkCore = api;
  if (typeof document === "undefined") return;

  const store = {
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
    studentId: store.read("italk.selectedStudent", ""),
    progress: store.read("italk.studentProgress", {}),
    activeScenario: null,
    session: null,
    timerId: null
  };

  const $ = selector => document.querySelector(selector);
  const els = {
    views: Array.from(document.querySelectorAll(".view")),
    studentSelect: $("#student-select"),
    home: $("#home-button"),
    roleName: $("#role-student-name"),
    studentName: $("#student-name"),
    teacherName: $("#teacher-student-name"),
    chooseStudent: $("#choose-student"),
    chooseTeacher: $("#choose-teacher"),
    heroScore: $("#hero-score"),
    heroProgress: $("#hero-progress"),
    heroMessage: $("#hero-message"),
    skillGrid: $("#skill-grid"),
    toggleDetails: $("#toggle-details"),
    scenarioGrid: $("#scenario-grid"),
    completedCount: $("#completed-count"),
    voiceSelect: $("#voice-select"),
    previewVoice: $("#preview-voice"),
    teacherSummary: $("#teacher-summary"),
    teacherForm: $("#teacher-form"),
    teacherStatus: $("#teacher-status"),
    teacherWishes: $("#teacher-wishes"),
    birthYear: $("#birth-year"),
    studentAge: $("#student-age"),
    teacherChronologicalAge: $("#teacher-chronological-age"),
    mentalAge: $("#mental-age"),
    topicDialog: $("#topic-dialog"),
    allScenarioGrid: $("#all-scenario-grid"),
    showAllTopics: $("#show-all-topics"),
    closeTopics: $("#close-topics"),
    customTopicForm: $("#custom-topic-form"),
    customTopicTitle: $("#custom-topic-title"),
    teacherSaveStatus: $("#teacher-save-status"),
    leaveConversation: $("#leave-conversation"),
    timer: $("#timer"),
    conversationIcon: $("#conversation-icon"),
    conversationTitle: $("#conversation-title"),
    conversationGoal: $("#conversation-goal"),
    activeFactors: $("#active-factors"),
    chatLog: $("#chat-log"),
    chatForm: $("#chat-form"),
    chatInput: $("#chat-input"),
    speechButton: $("#speech-button"),
    speechStatus: $("#speech-status"),
    suggestions: $("#reply-suggestions"),
    resultIcon: $("#result-icon"),
    resultTitle: $("#result-title"),
    resultMessage: $("#result-message"),
    resultStats: $("#result-stats"),
    resultHome: $("#result-home")
  };

  function currentStudent() {
    return STUDENTS.find(student => student.id === state.studentId);
  }

  function currentProgress() {
    const student = currentStudent();
    if (!student) return null;
    if (!state.progress[student.id]) state.progress[student.id] = createProgress(student);
    const progress = state.progress[student.id];
    if (!Array.isArray(progress.recentTopics)) progress.recentTopics = SCENARIOS.map(item => item.id);
    if (!Array.isArray(progress.customTopics)) progress.customTopics = [];
    if (progress.birthYear === undefined) progress.birthYear = "";
    if (progress.mentalAge === undefined) progress.mentalAge = "";
    return progress;
  }

  function allScenarios(progress) {
    return [...SCENARIOS, ...(progress.customTopics || [])];
  }

  function saveProgress() {
    store.write("italk.studentProgress", state.progress);
  }

  function showView(name) {
    els.views.forEach(view => { view.hidden = view.id !== `${name}-view`; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function populateStudents() {
    STUDENTS.forEach(student => {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = `${student.avatar} ${student.name}`;
      els.studentSelect.append(option);
    });
    els.studentSelect.value = state.studentId;
  }

  function selectStudent(id) {
    state.studentId = id;
    store.write("italk.selectedStudent", id);
    const student = currentStudent();
    if (!student) {
      showView("welcome");
      return;
    }
    currentProgress();
    saveProgress();
    els.roleName.textContent = student.name;
    showView("role");
  }

  function renderStudent() {
    const student = currentStudent();
    const progress = currentProgress();
    els.studentName.textContent = student.name;
    const hero = calculateHero(progress.levels, progress.completed.length);
    els.heroScore.textContent = hero;
    els.heroProgress.style.width = `${hero}%`;
    els.heroProgress.parentElement.setAttribute("aria-valuenow", String(hero));
    els.heroMessage.textContent = hero < 35 ? "Du er i gang – hvert forsøg tæller." :
      hero < 65 ? "Flot! Du klarer mere komplekse samtaler." :
      "Stærkt arbejde! Du træner samtaler på højt niveau.";

    els.skillGrid.replaceChildren();
    FACTORS.forEach(factor => {
      const level = clampLevel(progress.levels[factor.id]);
      const card = document.createElement("article");
      card.className = "skill-card";
      card.innerHTML = `
        <span class="skill-icon" aria-hidden="true">${factor.icon}</span>
        <div class="skill-copy">
          <div><strong>${factor.label}</strong><span>Trin ${level}/5</span></div>
          <div class="progress-track" role="progressbar" aria-label="${factor.label}" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${level}">
            <span style="width:${level * 20}%"></span>
          </div>
          <p>${describeFactor(factor.id, level)}</p>
        </div>`;
      els.skillGrid.append(card);
    });

    const age = chronologicalAge(progress.birthYear);
    els.birthYear.value = progress.birthYear || "";
    els.studentAge.textContent = age === null ? "Angiv fødselsår for at tilpasse emner og samtaler." : `Din alder: ${age} år`;
    els.completedCount.textContent = `${progress.completed.length} bestået`;
    els.scenarioGrid.replaceChildren();
    const scenarios = allScenarios(progress);
    (progress.recentTopics || []).map(id => scenarios.find(item => item.id === id)).filter(Boolean).slice(0, 5)
      .forEach(scenario => renderScenarioCard(scenario, els.scenarioGrid));
    populateAllTopics();
    populateVoices();
    showView("student");
  }

  function renderScenarioCard(scenario, container) {
    const progress = currentProgress();
    const completions = progress.completed.filter(id => id === scenario.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-card";
    button.innerHTML = `
      <span class="scenario-icon" aria-hidden="true">${scenario.icon}</span>
      <span><strong>${scenario.title}</strong><small>${scenario.goal}</small></span>
      <span class="scenario-status">${completions ? `✓ ${completions}` : "Start →"}</span>`;
    button.addEventListener("click", () => {
      if (els.topicDialog.open) els.topicDialog.close();
      startConversation(scenario);
    });
    container.append(button);
  }

  function populateAllTopics() {
    els.allScenarioGrid.replaceChildren();
    allScenarios(currentProgress()).forEach(scenario => renderScenarioCard(scenario, els.allScenarioGrid));
  }

  function renderTeacher() {
    const student = currentStudent();
    const progress = currentProgress();
    const hero = calculateHero(progress.levels, progress.completed.length);
    els.teacherName.textContent = student.name;
    els.teacherSummary.innerHTML = `
      <div><span class="summary-avatar">${student.avatar}</span><strong>${student.name}</strong><p>${student.profile}</p></div>
      <div class="summary-stat"><strong>${hero}</strong><span>Hero-score</span></div>
      <div class="summary-stat"><strong>${progress.completed.length}</strong><span>Bestået</span></div>
      <div class="summary-stat"><strong>${progress.attempts}</strong><span>Forsøg</span></div>`;
    els.teacherStatus.value = progress.notes.status || "";
    els.teacherWishes.value = progress.notes.wishes || "";
    const chronological = chronologicalAge(progress.birthYear);
    els.teacherChronologicalAge.textContent = chronological === null
      ? "Eleven har ikke angivet fødselsår endnu."
      : `Kronologisk alder: ${chronological} år (født ${progress.birthYear})`;
    els.mentalAge.value = progress.mentalAge || "";
    els.teacherSaveStatus.textContent = "";
    showView("teacher");
  }

  function availableVoices() {
    return "speechSynthesis" in window
      ? window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith("da"))
      : [];
  }

  function populateVoices() {
    const progress = currentProgress();
    const voices = availableVoices();
    els.voiceSelect.replaceChildren();
    const fallback = document.createElement("option");
    fallback.value = "";
    fallback.textContent = voices.length ? "Enhedens standardstemme" : "Standardstemme (dansk)";
    els.voiceSelect.append(fallback);
    voices.forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = voice.name;
      els.voiceSelect.append(option);
    });
    els.voiceSelect.value = progress.voice || "";
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const progress = currentProgress();
    const level = clampLevel(progress.levels.speed);
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = availableVoices().find(item => item.name === progress.voice);
    if (voice) utterance.voice = voice;
    utterance.lang = "da-DK";
    utterance.rate = [.72, .84, .96, 1.08, 1.2][level - 1];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;
    const who = role === "student" ? currentStudent().name : state.activeScenario.aiName;
    message.innerHTML = `<strong>${who}</strong><p></p>`;
    message.querySelector("p").textContent = text;
    els.chatLog.append(message);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
    if (role === "ai") speak(text);
  }

  function renderSuggestions(scenario) {
    els.suggestions.replaceChildren();
    scenario.suggestions.forEach(text => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.addEventListener("click", () => { els.chatInput.value = text; els.chatInput.focus(); });
      els.suggestions.append(button);
    });
  }

  function startConversation(scenario) {
    const progress = currentProgress();
    progress.recentTopics = rememberTopic(progress.recentTopics, scenario.id, 5);
    state.activeScenario = scenario;
    state.session = {
      remaining: clampLevel(progress.levels.duration) * 60,
      duration: clampLevel(progress.levels.duration) * 60,
      turns: 0,
      startedAt: Date.now()
    };
    progress.attempts += 1;
    saveProgress();
    els.conversationIcon.textContent = scenario.icon;
    els.conversationTitle.textContent = scenario.title;
    els.conversationGoal.textContent = scenario.goal;
    els.chatLog.replaceChildren();
    els.chatInput.value = "";
    els.activeFactors.replaceChildren();
    ["initiative", "warmth", "mood", "noise", "challenge", "speed", "duration"].forEach(id => {
      const factor = FACTORS.find(item => item.id === id);
      const chip = document.createElement("span");
      chip.textContent = `${factor.icon} ${describeFactor(id, progress.levels[id])}`;
      els.activeFactors.append(chip);
    });
    renderSuggestions(scenario);
    els.timer.textContent = formatTime(state.session.remaining);
    showView("conversation");
    const initiator = getInitiator(progress.levels.initiative);
    if (initiator === "ai") {
      const opening = scenario.opening[(clampLevel(progress.levels.extroversion) - 1) % scenario.opening.length];
      setTimeout(() => addMessage("ai", opening), 450);
    } else {
      addMessage("system", `Du tager det første initiativ. Start samtalen med ${scenario.aiName}.`);
      els.chatInput.focus();
    }
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (!state.session) return;
      state.session.remaining -= 1;
      els.timer.textContent = formatTime(state.session.remaining);
      if (state.session.remaining <= 0) finishConversation(true);
    }, 1000);
  }

  function finishConversation(completed) {
    clearInterval(state.timerId);
    if (!state.session) return;
    const session = state.session;
    const progress = currentProgress();
    const passed = completed && isConversationPassed(session);
    const requiredTurns = Math.max(2, Math.round(session.duration / 30));
    if (passed) {
      progress.completed.push(state.activeScenario.id);
      FACTORS.forEach((factor, index) => {
        if ((progress.completed.length + index) % 4 === 0) {
          progress.levels[factor.id] = Math.min(5, clampLevel(progress.levels[factor.id]) + 1);
        }
      });
      saveProgress();
    }
    state.session = null;
    els.resultIcon.textContent = passed ? "🏆" : "🌱";
    els.resultTitle.textContent = passed ? "Samtalen er bestået!" : "Godt forsøg";
    els.resultMessage.textContent = passed
      ? "Du holdt samtalen i gang i hele den aftalte tid. Dine fremskridt er gemt."
      : completed
        ? `Tiden gik, men samtalen havde brug for mindst ${requiredTurns} svar fra dig. Dit forsøg tæller stadig.`
        : "Øvelsen blev afsluttet før tid. Dit forsøg tæller stadig, og du kan prøve igen.";
    els.resultStats.innerHTML = `
      <div><strong>${session.turns}</strong><span>svar fra dig</span></div>
      <div><strong>${formatTime(session.duration - Math.max(0, session.remaining))}</strong><span>samtaletid</span></div>`;
    showView("result");
  }

  els.studentSelect.addEventListener("change", event => selectStudent(event.target.value));
  els.home.addEventListener("click", () => selectStudent(""));
  els.chooseStudent.addEventListener("click", renderStudent);
  els.chooseTeacher.addEventListener("click", renderTeacher);
  document.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.back === "welcome") {
        els.studentSelect.value = "";
        selectStudent("");
      } else showView("role");
    });
  });
  els.toggleDetails.addEventListener("click", () => {
    const hidden = els.skillGrid.hidden;
    els.skillGrid.hidden = !hidden;
    els.toggleDetails.textContent = hidden ? "Skjul detaljer" : "Vis detaljer";
    els.toggleDetails.setAttribute("aria-expanded", String(hidden));
  });
  els.voiceSelect.addEventListener("change", () => {
    currentProgress().voice = els.voiceSelect.value;
    saveProgress();
  });
  els.previewVoice.addEventListener("click", () => speak(`Hej ${currentStudent().name}. Sådan lyder min stemme.`));
  els.birthYear.addEventListener("change", () => {
    const progress = currentProgress();
    const age = chronologicalAge(els.birthYear.value);
    if (els.birthYear.value && age === null) {
      els.studentAge.textContent = "Skriv et gyldigt fødselsår.";
      return;
    }
    progress.birthYear = els.birthYear.value ? Number(els.birthYear.value) : "";
    saveProgress();
    els.studentAge.textContent = age === null ? "Angiv fødselsår for at tilpasse emner og samtaler." : `Din alder: ${age} år`;
  });
  els.showAllTopics.addEventListener("click", () => {
    populateAllTopics();
    if (typeof els.topicDialog.showModal === "function") els.topicDialog.showModal();
    else els.topicDialog.setAttribute("open", "");
  });
  els.closeTopics.addEventListener("click", () => els.topicDialog.close());
  els.customTopicForm.addEventListener("submit", event => {
    event.preventDefault();
    const progress = currentProgress();
    const scenario = createCustomScenario(els.customTopicTitle.value, effectiveAge(progress));
    if (!scenario) return;
    progress.customTopics.push(scenario);
    progress.recentTopics = rememberTopic(progress.recentTopics, scenario.id, 5);
    saveProgress();
    els.customTopicTitle.value = "";
    els.topicDialog.close();
    renderStudent();
  });
  if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", populateVoices);
  els.teacherForm.addEventListener("submit", event => {
    event.preventDefault();
    const progress = currentProgress();
    progress.notes.status = els.teacherStatus.value.trim();
    progress.notes.wishes = els.teacherWishes.value.trim();
    const mentalAge = Number(els.mentalAge.value);
    progress.mentalAge = els.mentalAge.value && mentalAge >= 2 && mentalAge <= 100 ? mentalAge : "";
    saveProgress();
    els.teacherSaveStatus.textContent = "Gemt på denne enhed ✓";
  });
  els.chatForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = els.chatInput.value.trim();
    if (!text || !state.session) return;
    addMessage("student", text);
    els.chatInput.value = "";
    state.session.turns += 1;
    const reply = chooseReply(state.activeScenario, state.session.turns, currentProgress().levels, text);
    const delay = [1500, 1200, 900, 650, 450][clampLevel(currentProgress().levels.speed) - 1];
    setTimeout(() => { if (state.session) addMessage("ai", reply); }, delay);
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "da-DK";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      els.speechButton.classList.add("listening");
      els.speechButton.setAttribute("aria-pressed", "true");
      els.speechStatus.textContent = "Lytter… tal nu";
    };
    recognition.onresult = event => {
      els.chatInput.value = Array.from(event.results).map(result => result[0].transcript).join("");
    };
    recognition.onend = () => {
      els.speechButton.classList.remove("listening");
      els.speechButton.setAttribute("aria-pressed", "false");
      els.speechStatus.textContent = els.chatInput.value
        ? "Talen er skrevet i svarfeltet. Ret den eller tryk Send."
        : "Tryk på mikrofonen for at svare med stemmen.";
    };
    recognition.onerror = event => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      els.speechStatus.textContent = denied
        ? "Mikrofonen blev ikke tilladt. Du kan stadig skrive dit svar."
        : "Talen kunne ikke genkendes. Prøv igen eller skriv svaret.";
    };
    els.speechButton.addEventListener("click", () => {
      try { recognition.start(); } catch (_) { recognition.stop(); }
    });
  } else {
    els.speechButton.disabled = true;
    els.speechStatus.textContent = "Talegenkendelse understøttes ikke her. Du kan skrive svaret.";
  }
  els.leaveConversation.addEventListener("click", () => {
    if (window.confirm("Vil du afslutte øvelsen før tid?")) finishConversation(false);
  });
  els.resultHome.addEventListener("click", renderStudent);

  populateStudents();
  if (state.studentId && currentStudent()) selectStudent(state.studentId);
  else showView("welcome");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
