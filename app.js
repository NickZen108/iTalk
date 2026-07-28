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

  function defaultLevels() {
    return Object.fromEntries(FACTORS.map(factor => [factor.id, 1]));
  }

  function topicProgress(progress, scenarioId) {
    if (!progress.topicProgress || typeof progress.topicProgress !== "object") progress.topicProgress = {};
    if (!progress.topicProgress[scenarioId]) {
      progress.topicProgress[scenarioId] = { levels: defaultLevels(), records: defaultLevels() };
    }
    const topic = progress.topicProgress[scenarioId];
    topic.levels = Object.assign(defaultLevels(), topic.levels || {});
    topic.records = Object.assign(defaultLevels(), topic.records || {});
    FACTORS.forEach(factor => {
      topic.levels[factor.id] = clampLevel(topic.levels[factor.id]);
      topic.records[factor.id] = clampLevel(topic.records[factor.id]);
    });
    return topic;
  }

  function updateRecords(records, levels) {
    const next = Object.assign(defaultLevels(), records || {});
    FACTORS.forEach(factor => {
      next[factor.id] = Math.max(clampLevel(next[factor.id]), clampLevel(levels[factor.id]));
    });
    return next;
  }

  function createProgress(student) {
    return {
      completed: [],
      attempts: 0,
      voice: "",
      birthYear: "",
      mentalAge: "",
      recentTopics: SCENARIOS.map(item => item.id),
      customTopics: [],
      topicProgress: {},
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
    const clean = String(input || "").toLowerCase().trim();
    const unsafe = /(på taget|oppe på taget|ud på vejen|midt på vejen|slå|sparke|skubbe|hoved(?:et|er|erne)?|ild|kniv|kvæle|hoppe ud)/.test(clean);
    const hostile = /(tarvelig|dum|idiot|had(?:er)?|hold kæft|skal bare|ellers vil jeg|kun hvis du|tvinge)/.test(clean);
    const upset = /(ked af|bange|nervøs|sur|vred|ubehagelig|vil ikke være med)/.test(clean);
    if (unsafe) {
      return "Det forslag lyder ikke sikkert. Jeg vil gerne finde på noget, hvor ingen kan komme til skade. Hvad med skolegården eller boldbanen?";
    }
    if (hostile) {
      return "Jeg vil gerne lege, men jeg vil ikke kaldes noget grimt eller presses. Prøv at sige dit ønske på en venlig måde, så kan vi finde en løsning sammen.";
    }
    if (upset) {
      return "Tak fordi du siger det. Vi kan stoppe op og finde en løsning, der føles tryg for os begge. Hvad vil hjælpe dig lige nu?";
    }
    const definitions = {
      kompromis: "Et kompromis betyder, at vi begge giver os lidt, så vi kan blive enige. Vi kunne for eksempel lege din leg først og min bagefter.",
      størrelse: "Størrelse fortæller, hvor stort eller småt tøjet er, for eksempel 128, small eller medium.",
      lyskryds: "Et lyskryds er stedet, hvor røde, gule og grønne lys hjælper biler og mennesker sikkert over vejen."
    };
    const definitionWord = Object.keys(definitions).find(word =>
      clean.includes(word) && /(hvad betyder|hvad er|forstår ikke|forklar)/.test(clean)
    );
    if (definitionWord) return definitions[definitionWord];
    if (/tak|farvel|hej hej/.test(clean)) return "Selv tak. Er der noget mere, du vil spørge om?";
    if (/forstår ikke|gentag|igen|hvad mener du/.test(clean)) {
      return "Selvfølgelig. Jeg prøver med enklere ord. Hvilken del skal jeg forklare?";
    }
    if (/^(ja|okay|ok|gerne|det vil jeg)/.test(clean)) {
      const affirmations = {
        play: "Fint! Hvad skal vi begynde med, og hvem vil du spørge, om de vil være med?",
        directions: "Godt. Fortsæt ligeud til lyskrydset. Hvad vil du vide bagefter?",
        clothes: "Fint. Vil du prøve trøjen eller se den i en anden størrelse?",
        cafe: "Fint. Skal der være noget særligt i eller på din bestilling?",
        group: "Dejligt. Hvilken opgave vil du helst hjælpe gruppen med?"
      };
      return affirmations[scenario.id] || "Fint. Fortæl mig gerne lidt mere.";
    }
    if (/^(nej|ellers tak|det vil jeg ikke)|ikke lyst|kan ikke lide/.test(clean)) {
      const rejections = {
        play: "Det er helt okay. Hvad kunne du bedre tænke dig at lege?",
        directions: "Okay. Skal jeg forklare en anden vej?",
        clothes: "Helt i orden. Hvad leder du efter i stedet?",
        cafe: "Helt i orden. Hvad kunne du tænke dig i stedet?",
        group: "Det er okay. Er der en anden rolle, du hellere vil have?"
      };
      return rejections[scenario.id] || "Det er helt okay. Hvad vil du hellere?";
    }
    if (scenario.id === "play") {
      if (/hvem/.test(clean)) return "Vi kan spørge Alma og Malik, om de vil være med. Hvem vil du helst spørge først?";
      if (/hvor/.test(clean)) return "Vi kan lege ude i skolegården eller inde i fællesrummet. Hvad passer bedst?";
      if (/hvad vil du|lyst til/.test(clean)) return "Jeg har lyst til fangeleg, men jeg vil også gerne høre din idé.";
      if (/skal vi|vi kan|jeg vil gerne|lad os/.test(clean)) {
        const activity =
          clean.match(/(?:lege|spille|lave)\s+([a-zæøå ]{2,30})/)?.[1]
            ?.replace(/\b(med|oppe|ude|inde|på)\b.*$/, "")
            .trim();
        return activity
          ? `${activity[0].toUpperCase()}${activity.slice(1)} kunne være en mulighed. Hvor kan vi gøre det sikkert, og hvad gør vi, hvis en anden hellere vil lege noget andet?`
          : "Det lyder som et forslag. Hvor kan vi gøre det sikkert, og hvad gør vi, hvis jeg hellere vil noget andet?";
      }
    }
    if (scenario.id === "directions") {
      if (/hvor lang|hvor langt|tid/.test(clean)) return "Det tager cirka fem minutter at gå. Vil du have et sted at holde øje med undervejs?";
      if (/højre|venstre|dreje/.test(clean)) return "Gå ligeud og drej til højre efter bageren. Kan du gentage ruten med dine egne ord?";
      if (/hvor|vej|bibliotek/.test(clean)) return "Biblioteket ligger efter bageren på højre side. Ved du, hvor bageren er?";
    }
    if (scenario.id === "clothes") {
      if (/pris|koster|krone/.test(clean)) return "Trøjen koster 249 kroner. Vil du også vide, om den er på tilbud?";
      if (/størrelse|small|medium|large/.test(clean)) return "Vi har den i small, medium og large. Hvilken størrelse vil du prøve?";
      if (/farve|blå|grøn|rød|sort/.test(clean)) return "Den findes i blå, grøn og sort. Hvilken farve kan du bedst lide?";
    }
    if (scenario.id === "cafe") {
      if (/koster|pris|krone/.test(clean)) return "Den koster 38 kroner. Vil du betale med kort eller kontanter?";
      if (/stor|lille|størrelse/.test(clean)) return "Du kan vælge en lille eller stor. Hvilken vil du have?";
      if (/allerg|mælk|laktose/.test(clean)) return "Vi kan lave den med almindelig mælk eller havredrik. Hvad passer dig?";
    }
    if (scenario.id === "group") {
      if (/må jeg|være med/.test(clean)) return "Ja, du må gerne være med. Vil du bygge, finde materialer eller holde styr på reglerne?";
      if (/hjælpe|opgave|rolle/.test(clean)) return "Du kan hjælpe med at finde materialer. Passer det, eller vil du hellere have en anden opgave?";
    }
    if (/\?$|^(hvad|hvem|hvor|hvornår|hvordan|hvorfor|kan|må)/.test(clean)) {
      return "Godt spørgsmål. Jeg er ikke helt sikker på, hvad du mener endnu. Kan du spørge med lidt flere ord?";
    }
    const challenge = clampLevel(levels.challenge);
    const index = challenge >= 4 ? (turn + 1) % scenario.replies.length : turn % scenario.replies.length;
    return scenario.replies[index];
  }

  const api = {
    FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
    defaultLevels, topicProgress, updateRecords, createProgress, chronologicalAge, effectiveAge, rememberTopic,
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

  const localStudents = store.read("elevspor.localStudents", []);
  STUDENTS.splice(0, STUDENTS.length, ...(Array.isArray(localStudents) ? localStudents : []));

  const state = {
    studentId: store.read("italk.selectedStudent", ""),
    progress: store.read("italk.studentProgress", {}),
    activeScenario: null,
    session: null,
    timerId: null,
    approval: null
  };

  const $ = selector => document.querySelector(selector);
  const els = {
    views: Array.from(document.querySelectorAll(".view")),
    home: $("#home-button"),
    roleName: $("#role-student-name"),
    studentName: $("#student-name"),
    teacherName: $("#teacher-student-name"),
    chooseStudent: $("#choose-student"),
    chooseTeacher: $("#choose-teacher"),
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
    resultHome: $("#result-home"),
    schoolSessionStatus: $("#school-session-status"),
    schoolLoginForm: $("#school-login-form"),
    schoolEmail: $("#school-email"),
    schoolPassword: $("#school-password"),
    schoolSignup: $("#school-signup"),
    schoolOnboardingForm: $("#school-onboarding-form"),
    schoolName: $("#school-name"),
    schoolSignout: $("#school-signout"),
    dashboardSignout: $("#dashboard-signout"),
    teacherProfileName: $("#teacher-profile-name"),
    createStudentForm: $("#create-student-form"),
    newStudentName: $("#new-student-name"),
    newStudentBirthYear: $("#new-student-birth-year"),
    createStudentStatus: $("#create-student-status"),
    teacherStudentList: $("#teacher-student-list"),
    studentApprovalPanel: $("#student-approval-panel"),
    teacherApprovalStatus: $("#teacher-approval-status"),
    approveStudent: $("#approve-student")
  };
  Object.assign(els, {
    setupIcon: $("#setup-scenario-icon"),
    setupTitle: $("#setup-scenario-title"),
    setupGoal: $("#setup-scenario-goal"),
    factorGrid: $("#scenario-factor-grid"),
    cancelSetup: $("#cancel-scenario-setup"),
    beginConversation: $("#begin-conversation")
  });

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
    if (!progress.topicProgress || typeof progress.topicProgress !== "object") progress.topicProgress = {};
    return progress;
  }

  function allScenarios(progress) {
    return [...SCENARIOS, ...(progress.customTopics || [])];
  }

  function saveProgress() {
    store.write("italk.studentProgress", state.progress);
  }

  function backendLocalStudentId(studentId) {
    const key = `elevspor.backendStudent.${studentId}`;
    let id = store.read(key, "");
    if (!id) {
      id = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      store.write(key, id);
    }
    return id;
  }

  async function recordBackendActivity(type, durationSeconds) {
    const backend = globalThis.ElevsporSupabase;
    const progress = currentProgress();
    if (!backend?.configured || !state.studentId || !progress) return;
    try {
      await backend.recordActivity(
        backendLocalStudentId(state.studentId),
        type,
        durationSeconds,
        progress.birthYear || null
      );
    } catch (error) {
      console.warn("Elevspor-aktivitet kunne ikke synkroniseres", error);
    }
  }

  async function loadStudentApproval() {
    const backend = globalThis.ElevsporSupabase;
    const progress = currentProgress();
    if (!backend?.configured) return { status: "unavailable", message: "Skolens forbindelse er ikke konfigureret." };
    if (!await backend.getSession()) return { status: "unavailable", message: "En medarbejder skal logge skolen ind på enheden først." };
    try {
      const student = await backend.getStudentApproval(
        backendLocalStudentId(state.studentId),
        progress.birthYear || null
      );
      state.approval = student;
      return {
        status: student.approval_status,
        student,
        message: student.approval_status === "approved"
          ? "Godkendt af en lærer. Du kan gå i gang."
          : student.approval_status === "rejected"
            ? "Tilmeldingen er afvist. Tal med en lærer."
            : "Din tilmelding venter på en lærers godkendelse."
      };
    } catch (error) {
      state.approval = null;
      return { status: "unavailable", message: `Adgangen kunne ikke kontrolleres: ${error.message}` };
    }
  }

  function setTrainingAvailability(approved) {
    document.querySelectorAll(".scenario-card, #show-all-topics, #begin-conversation")
      .forEach(control => { control.disabled = !approved; });
  }

  async function refreshStudentApproval() {
    const approval = await loadStudentApproval();
    const approved = approval.status === "approved";
    els.studentApprovalPanel.dataset.status = approval.status;
    els.studentApprovalPanel.innerHTML = approved
      ? `<strong>✓ Godkendt</strong><p>${approval.message}</p>`
      : `<strong>${approval.status === "pending" ? "Afventer lærer" : "Adgang ikke klar"}</strong><p>${approval.message}</p>`;
    setTrainingAvailability(approved);
    return approval;
  }

  function showView(name) {
    els.views.forEach(view => { view.hidden = view.id !== `${name}-view`; });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function saveLocalStudents() {
    store.write("elevspor.localStudents", STUDENTS);
  }

  async function renderSchoolDashboard() {
    const backend = globalThis.ElevsporSupabase;
    const session = await backend?.getSession();
    if (!session) {
      showView("welcome");
      return;
    }
    const membership = await backend.getMembership();
    if (!membership) {
      showView("welcome");
      return;
    }
    const displayName = session.user.user_metadata?.display_name
      || session.user.email?.split("@")[0]
      || "Lærer";
    els.teacherProfileName.textContent = `${displayName} · ${membership.schools?.name || "skolen"}`;
    els.teacherStudentList.replaceChildren();
    if (!STUDENTS.length) {
      const empty = document.createElement("p");
      empty.className = "approval-panel";
      empty.textContent = "Der er endnu ingen elever på denne enhed.";
      els.teacherStudentList.append(empty);
    }
    for (const student of STUDENTS) {
      state.studentId = student.id;
      currentProgress();
      const approval = await loadStudentApproval();
      const card = document.createElement("article");
      card.className = "student-admin-card";
      card.innerHTML = `
        <div><strong>${student.avatar} ${student.name}</strong>
        <p>${approval.status === "approved" ? "Godkendt" : approval.status === "pending" ? "Afventer lærerens godkendelse" : approval.message}</p></div>
        <div class="student-admin-actions"></div>`;
      const actions = card.querySelector(".student-admin-actions");
      if (approval.status === "pending") {
        const approve = document.createElement("button");
        approve.className = "primary-button";
        approve.type = "button";
        approve.textContent = "Godkend";
        approve.addEventListener("click", async () => {
          approve.disabled = true;
          try {
            await backend.approveStudent(approval.student.id);
            await renderSchoolDashboard();
          } catch (error) {
            card.querySelector("p").textContent = `Godkendelse mislykkedes: ${error.message}`;
            approve.disabled = false;
          }
        });
        actions.append(approve);
      }
      const pupilButton = document.createElement("button");
      pupilButton.className = "secondary-button";
      pupilButton.type = "button";
      pupilButton.textContent = "Åbn elevområde";
      pupilButton.disabled = approval.status !== "approved";
      pupilButton.addEventListener("click", () => {
        selectStudent(student.id);
        void renderStudent();
      });
      const teacherButton = document.createElement("button");
      teacherButton.className = "secondary-button";
      teacherButton.type = "button";
      teacherButton.textContent = "Status og indstillinger";
      teacherButton.addEventListener("click", () => {
        selectStudent(student.id);
        void renderTeacher();
      });
      actions.append(pupilButton, teacherButton);
      els.teacherStudentList.append(card);
    }
    state.studentId = "";
    store.write("italk.selectedStudent", "");
    showView("school-dashboard");
  }

  async function renderStudent() {
    const student = currentStudent();
    const progress = currentProgress();
    els.studentName.textContent = student.name;
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
    setTrainingAvailability(false);
    await refreshStudentApproval();
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
      openScenarioSetup(scenario);
    });
    container.append(button);
  }

  function populateAllTopics() {
    els.allScenarioGrid.replaceChildren();
    allScenarios(currentProgress()).forEach(scenario => renderScenarioCard(scenario, els.allScenarioGrid));
  }

  function openScenarioSetup(scenario) {
    const progress = currentProgress();
    const topic = topicProgress(progress, scenario.id);
    state.activeScenario = scenario;
    els.setupIcon.textContent = scenario.icon;
    els.setupTitle.textContent = scenario.title;
    els.setupGoal.textContent = scenario.goal;
    els.factorGrid.replaceChildren();
    FACTORS.forEach(factor => {
      const level = clampLevel(topic.levels[factor.id]);
      const record = clampLevel(topic.records[factor.id]);
      const label = document.createElement("label");
      label.className = "factor-control";
      label.innerHTML = `
        <span class="skill-icon" aria-hidden="true">${factor.icon}</span>
        <span class="factor-copy">
          <span class="factor-heading"><strong>${factor.label}</strong><span data-level>Trin ${level}/5</span></span>
          <input type="range" min="1" max="5" step="1" value="${level}" aria-label="${factor.label}">
          <span class="factor-description" data-description>${describeFactor(factor.id, level)}</span>
          <span class="factor-record">Rekord: ${record}</span>
        </span>`;
      const input = label.querySelector("input");
      input.addEventListener("input", () => {
        const value = clampLevel(input.value);
        topic.levels[factor.id] = value;
        label.querySelector("[data-level]").textContent = `Trin ${value}/5`;
        label.querySelector("[data-description]").textContent = describeFactor(factor.id, value);
        saveProgress();
      });
      els.factorGrid.append(label);
    });
    saveProgress();
    showView("scenario-setup");
  }

  async function renderTeacher() {
    const student = currentStudent();
    const progress = currentProgress();
    els.teacherName.textContent = student.name;
    els.teacherSummary.innerHTML = `
      <div><span class="summary-avatar">${student.avatar}</span><strong>${student.name}</strong><p>${student.profile}</p></div>
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
    els.approveStudent.hidden = true;
    els.teacherApprovalStatus.textContent = "Kontrollerer elevens status…";
    const approval = await loadStudentApproval();
    if (approval.status === "approved") {
      els.teacherApprovalStatus.textContent = "Eleven er godkendt og kan bruge samtaletræningen.";
    } else if (approval.status === "pending") {
      els.teacherApprovalStatus.textContent = "Eleven afventer godkendelse. Godkendelse gør det muligt at starte øvelser og registrere aktivitet.";
      els.approveStudent.dataset.studentId = approval.student.id;
      els.approveStudent.hidden = false;
    } else {
      els.teacherApprovalStatus.textContent = approval.message;
    }
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
    const levels = state.activeScenario ? topicProgress(progress, state.activeScenario.id).levels : defaultLevels();
    const level = clampLevel(levels.speed);
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
    const levels = topicProgress(progress, scenario.id).levels;
    progress.recentTopics = rememberTopic(progress.recentTopics, scenario.id, 5);
    state.activeScenario = scenario;
    state.session = {
      levels: Object.assign({}, levels),
      remaining: clampLevel(levels.duration) * 60,
      duration: clampLevel(levels.duration) * 60,
      turns: 0,
      startedAt: Date.now()
    };
    progress.attempts += 1;
    saveProgress();
    void recordBackendActivity("conversation_started", null);
    els.conversationIcon.textContent = scenario.icon;
    els.conversationTitle.textContent = scenario.title;
    els.conversationGoal.textContent = scenario.goal;
    els.chatLog.replaceChildren();
    els.chatInput.value = "";
    els.activeFactors.replaceChildren();
    ["initiative", "warmth", "mood", "noise", "challenge", "speed", "duration"].forEach(id => {
      const factor = FACTORS.find(item => item.id === id);
      const chip = document.createElement("span");
      chip.textContent = `${factor.icon} ${describeFactor(id, levels[id])}`;
      els.activeFactors.append(chip);
    });
    renderSuggestions(scenario);
    els.timer.textContent = formatTime(state.session.remaining);
    showView("conversation");
    const initiator = getInitiator(levels.initiative);
    if (initiator === "ai") {
      const opening = scenario.opening[(clampLevel(levels.extroversion) - 1) % scenario.opening.length];
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
      const topic = topicProgress(progress, state.activeScenario.id);
      topic.records = updateRecords(topic.records, session.levels);
      saveProgress();
    }
    const elapsedSeconds = session.duration - Math.max(0, session.remaining);
    void recordBackendActivity("conversation_completed", elapsedSeconds);
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

  els.home.addEventListener("click", () => selectStudent(""));
  els.chooseStudent.addEventListener("click", () => { void renderStudent(); });
  els.chooseTeacher.addEventListener("click", () => { void renderTeacher(); });
  document.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.back === "welcome") {
        selectStudent("");
      } else if (button.dataset.back === "school-dashboard") {
        void renderSchoolDashboard();
      } else showView("role");
    });
  });
  els.cancelSetup.addEventListener("click", () => { void renderStudent(); });
  els.beginConversation.addEventListener("click", () => {
    if (state.approval?.approval_status === "approved" && state.activeScenario) {
      startConversation(state.activeScenario);
    }
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
  els.createStudentForm.addEventListener("submit", async event => {
    event.preventDefault();
    const name = els.newStudentName.value.trim();
    const birthYear = Number(els.newStudentBirthYear.value);
    if (!name || birthYear < 1926 || birthYear > 2026) return;
    const id = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const student = {
      id,
      name,
      avatar: "🎯",
      profile: "Ny elevprofil",
      levels: defaultLevels()
    };
    STUDENTS.push(student);
    saveLocalStudents();
    state.studentId = id;
    const progress = currentProgress();
    progress.birthYear = birthYear;
    saveProgress();
    els.createStudentStatus.textContent = "Opretter sikker elevtilmelding…";
    try {
      await globalThis.ElevsporSupabase.getStudentApproval(
        backendLocalStudentId(id),
        birthYear
      );
      els.createStudentForm.reset();
      els.createStudentStatus.textContent = "Eleven er oprettet og afventer godkendelse.";
      await renderSchoolDashboard();
    } catch (error) {
      els.createStudentStatus.textContent = `Eleven kunne ikke tilmeldes: ${error.message}`;
    }
  });
  els.approveStudent.addEventListener("click", async () => {
    const studentId = els.approveStudent.dataset.studentId;
    if (!studentId) return;
    els.approveStudent.disabled = true;
    els.teacherApprovalStatus.textContent = "Godkender eleven…";
    try {
      await globalThis.ElevsporSupabase.approveStudent(studentId);
      els.teacherApprovalStatus.textContent = "Eleven er godkendt ✓";
      els.approveStudent.hidden = true;
      state.approval = { ...state.approval, approval_status: "approved" };
    } catch (error) {
      els.teacherApprovalStatus.textContent = `Godkendelsen mislykkedes: ${error.message}`;
      els.approveStudent.disabled = false;
    }
  });
  function sendStudentMessage() {
    const text = els.chatInput.value.trim();
    if (!text || !state.session) return false;
    addMessage("student", text);
    els.chatInput.value = "";
    state.session.turns += 1;
    const reply = chooseReply(state.activeScenario, state.session.turns, state.session.levels, text);
    const delay = [1500, 1200, 900, 650, 450][clampLevel(state.session.levels.speed) - 1];
    setTimeout(() => { if (state.session) addMessage("ai", reply); }, delay);
    return true;
  }
  els.chatForm.addEventListener("submit", event => {
    event.preventDefault();
    sendStudentMessage();
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    let heardFinalResult = false;
    recognition = new SpeechRecognition();
    recognition.lang = "da-DK";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      heardFinalResult = false;
      els.speechButton.classList.add("listening");
      els.speechButton.setAttribute("aria-pressed", "true");
      els.speechStatus.textContent = "Lytter… tal nu";
    };
    recognition.onresult = event => {
      els.chatInput.value = Array.from(event.results).map(result => result[0].transcript).join("");
      heardFinalResult = Array.from(event.results).some(result => result.isFinal);
    };
    recognition.onend = () => {
      els.speechButton.classList.remove("listening");
      els.speechButton.setAttribute("aria-pressed", "false");
      if (heardFinalResult && els.chatInput.value.trim()) {
        els.speechStatus.textContent = "Svar modtaget ✓";
        sendStudentMessage();
      } else {
        els.speechStatus.textContent = els.chatInput.value
          ? "Talen blev ikke afsluttet. Ret svaret eller tryk Send."
          : "Tryk på mikrofonen for at svare med stemmen.";
      }
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
  els.resultHome.addEventListener("click", () => { void renderStudent(); });

  async function refreshSchoolSession() {
    const backend = globalThis.ElevsporSupabase;
    if (!backend?.configured) {
      els.schoolSessionStatus.textContent = "Supabase er ikke konfigureret i denne udgave.";
      els.schoolLoginForm.hidden = false;
      return;
    }
    try {
      const session = await backend.getSession();
      if (!session) {
        els.schoolSessionStatus.textContent = "Ikke logget ind.";
        els.schoolLoginForm.hidden = false;
        els.schoolOnboardingForm.hidden = true;
        els.schoolSignout.hidden = true;
        return;
      }
      const membership = await backend.getMembership();
      els.schoolLoginForm.hidden = true;
      els.schoolSignout.hidden = false;
      if (membership) {
        const schoolName = membership.schools?.name || "skolen";
        els.schoolSessionStatus.textContent = `Forbundet til ${schoolName} · ${membership.role}`;
        els.schoolOnboardingForm.hidden = true;
        await renderSchoolDashboard();
      } else {
        els.schoolSessionStatus.textContent = "Login er godkendt. Registrér skolen for at fortsætte.";
        els.schoolOnboardingForm.hidden = false;
      }
    } catch (error) {
      els.schoolSessionStatus.textContent = `Forbindelsesfejl: ${error.message}`;
    }
  }

  els.schoolLoginForm.addEventListener("submit", async event => {
    event.preventDefault();
    els.schoolSessionStatus.textContent = "Logger ind…";
    try {
      await globalThis.ElevsporSupabase.signIn(
        els.schoolEmail.value.trim(),
        els.schoolPassword.value
      );
      els.schoolPassword.value = "";
      await refreshSchoolSession();
    } catch (error) {
      els.schoolSessionStatus.textContent = `Login mislykkedes: ${error.message}`;
    }
  });
  els.schoolSignup.addEventListener("click", async () => {
    if (!els.schoolLoginForm.reportValidity()) return;
    els.schoolSessionStatus.textContent = "Opretter medarbejder…";
    try {
      const result = await globalThis.ElevsporSupabase.signUp(
        els.schoolEmail.value.trim(),
        els.schoolPassword.value
      );
      els.schoolPassword.value = "";
      els.schoolSessionStatus.textContent = result.session
        ? "Medarbejderen er oprettet."
        : "Medarbejderen er oprettet. Bekræft e-mailen, og log derefter ind.";
      await refreshSchoolSession();
    } catch (error) {
      els.schoolSessionStatus.textContent = `Oprettelse mislykkedes: ${error.message}`;
    }
  });
  els.schoolOnboardingForm.addEventListener("submit", async event => {
    event.preventDefault();
    els.schoolSessionStatus.textContent = "Registrerer skole…";
    try {
      await globalThis.ElevsporSupabase.registerSchool(els.schoolName.value.trim());
      els.schoolName.value = "";
      await refreshSchoolSession();
    } catch (error) {
      els.schoolSessionStatus.textContent = `Skolen kunne ikke registreres: ${error.message}`;
    }
  });
  els.schoolSignout.addEventListener("click", async () => {
    try {
      await globalThis.ElevsporSupabase.signOut();
    } finally {
      await refreshSchoolSession();
    }
  });
  els.dashboardSignout.addEventListener("click", async () => {
    await globalThis.ElevsporSupabase.signOut();
    showView("welcome");
    await refreshSchoolSession();
  });

  void refreshSchoolSession();
  showView("welcome");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./service-worker.js");
        await registration.update();
      } catch (_) {}
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
