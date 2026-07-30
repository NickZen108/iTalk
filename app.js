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

  const SCHOOL_ROUTES = Object.freeze({
    students: "/elever",
    "create-student": "/opret-elev",
    staff: "/medarbejdere",
    audit: "/auditspor"
  });
  const SCHOOL_PAGES = Object.freeze(
    Object.fromEntries(Object.entries(SCHOOL_ROUTES).map(([page, route]) => [route, page]))
  );

  function schoolPageFromHash(hash = "") {
    const route = String(hash).replace(/^#/, "").replace(/\/+$/, "") || "/";
    return SCHOOL_PAGES[route] || "";
  }

  function schoolHashForPage(page) {
    return SCHOOL_ROUTES[page] ? `#${SCHOOL_ROUTES[page]}` : "";
  }

  function studentIdentityLabel(student, birthYear = "") {
    const parts = [student.name];
    if (student.localLabel) parts.push(student.localLabel);
    if (birthYear) parts.push(String(birthYear));
    return parts.join(" · ");
  }

  function adminOnboardingStorageKey(schoolId, userId) {
    return `elevspor.adminOnboardingDismissed.${schoolId}.${userId}`;
  }

  function normalizeStudentAccessSecret(value) {
    return String(value || "").replace(/[^A-Fa-f0-9]/g, "");
  }

  function studentAccessErrorMessage(error, online = true) {
    const message = String(error?.message || "");
    if (!online || /failed to fetch|network|fetch failed|load failed/i.test(message)) {
      return "Forbindelsen til ElevSpor forsvandt. Tjek nettet, og prøv igen. Hvis koden derefter afvises, skal læreren oprette en ny.";
    }
    if (/ugyldig|udløbet|invalid|expired/i.test(message)) {
      return "Adgangen er ugyldig, udløbet eller allerede brugt. Bed læreren om en ny QR-kode eller engangskode.";
    }
    return "Elevadgangen kunne ikke åbnes. Prøv igen, eller bed læreren om en ny adgang.";
  }

  function isTestSchool(name) {
    return String(name || "").trim().toLocaleLowerCase("da") === "test-skole";
  }

  function testChecklistStorageKey(schoolId, userId) {
    return `elevspor.testChecklistManual.${schoolId}.${userId}`;
  }

  const api = {
    FACTORS, STUDENTS, SCENARIOS, clampLevel, describeFactor,
    defaultLevels, topicProgress, updateRecords, createProgress, chronologicalAge, effectiveAge, rememberTopic,
    createCustomScenario, getInitiator, isConversationPassed, chooseReply,
    schoolPageFromHash, schoolHashForPage, studentIdentityLabel, adminOnboardingStorageKey,
    normalizeStudentAccessSecret, studentAccessErrorMessage, isTestSchool, testChecklistStorageKey
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

  const defaultTestStudent = {
    id: "test-elev",
    name: "Test-Elev",
    avatar: "🧭",
    profile: "Kontrolleret testprofil til elevvisningen.",
    levels: defaultLevels()
  };
  const localStudents = store.read("elevspor.localStudents", [defaultTestStudent]);
  STUDENTS.splice(0, STUDENTS.length, ...(Array.isArray(localStudents) ? localStudents : []));

  const state = {
    studentId: store.read("italk.selectedStudent", ""),
    progress: store.read("italk.studentProgress", {}),
    activeScenario: null,
    session: null,
    timerId: null,
    approval: null,
    canManageStaff: false,
    managedStudentEntry: null,
    schoolAuditEvents: [],
    schoolAuditStudentLabels: new Map(),
    schoolId: "",
    testChecklistContext: null
  };
  state.pendingStudentAccessSecret = "";

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
    resultStudentName: $("#result-student-name"),
    resultTitle: $("#result-title"),
    resultMessage: $("#result-message"),
    resultStats: $("#result-stats"),
    resultHome: $("#result-home"),
    schoolSessionStatus: $("#school-session-status"),
    openSchoolDashboard: $("#open-school-dashboard"),
    schoolLoginForm: $("#school-login-form"),
    schoolEmail: $("#school-email"),
    schoolPassword: $("#school-password"),
    schoolSignup: $("#school-signup"),
    invitedSignupPanel: $("#invited-signup-panel"),
    schoolSignout: $("#school-signout"),
    dashboardSignout: $("#dashboard-signout"),
    adminOnboarding: $("#admin-onboarding"),
    showAdminOnboarding: $("#show-admin-onboarding"),
    dismissAdminOnboarding: $("#dismiss-admin-onboarding"),
    startAdminOnboarding: $("#start-admin-onboarding"),
    testSchoolChecklist: $("#test-school-checklist"),
    refreshTestChecklist: $("#refresh-test-checklist"),
    testChecklistStatus: $("#test-checklist-status"),
    testCheckTeacher: $("#test-check-teacher"),
    testCheckTeacherText: $("#test-check-teacher-text"),
    testCheckDevice: $("#test-check-device"),
    testCheckDeviceText: $("#test-check-device-text"),
    testCheckActivity: $("#test-check-activity"),
    testCheckActivityText: $("#test-check-activity-text"),
    testCheckReview: $("#test-check-review"),
    testCheckTeacherReview: $("#test-check-teacher-review"),
    testCheckAuditReview: $("#test-check-audit-review"),
    resetTestChecklistManual: $("#reset-test-checklist-manual"),
    teacherProfileName: $("#teacher-profile-name"),
    createStudentForm: $("#create-student-form"),
    newStudentName: $("#new-student-name"),
    newStudentBirthYear: $("#new-student-birth-year"),
    newStudentLabel: $("#new-student-label"),
    createStudentButton: $("#create-student-button"),
    createStudentStatus: $("#create-student-status"),
    schoolPages: Array.from(document.querySelectorAll(".school-page")),
    schoolNavButtons: Array.from(document.querySelectorAll(".school-nav-button")),
    staffPageButton: $("#staff-page-button"),
    auditPageButton: $("#audit-page-button"),
    pendingStudentList: $("#pending-student-list"),
    recentStudentList: $("#recent-student-list"),
    allStudentList: $("#all-student-list"),
    pendingStudentCount: $("#pending-student-count"),
    studentSearch: $("#student-search"),
    studentSearchEmpty: $("#student-search-empty"),
    studentsPageStatus: $("#students-page-status"),
    studentApprovalPanel: $("#student-approval-panel"),
    teacherApprovalStatus: $("#teacher-approval-status"),
    approveStudent: $("#approve-student"),
    staffInvitationPanel: $("#staff-invitation-panel"),
    staffInvitationForm: $("#staff-invitation-form"),
    staffInvitationEmail: $("#staff-invitation-email"),
    staffInvitationRole: $("#staff-invitation-role"),
    staffInvitationResult: $("#staff-invitation-result"),
    staffInvitationLink: $("#staff-invitation-link"),
    staffInvitationStatus: $("#staff-invitation-status"),
    copyStaffInvitation: $("#copy-staff-invitation"),
    staffInvitationEmpty: $("#staff-invitation-empty")
  };
  Object.assign(els, {
    schoolAuditFilters: $("#school-audit-filters"),
    auditFrom: $("#audit-from"),
    auditTo: $("#audit-to"),
    auditActor: $("#audit-actor"),
    auditStudent: $("#audit-student"),
    auditAction: $("#audit-action"),
    schoolAuditStatus: $("#school-audit-status"),
    schoolAuditList: $("#school-audit-list"),
    exportSchoolAudit: $("#export-school-audit"),
    resetSchoolAudit: $("#reset-school-audit")
  });
  Object.assign(els, {
    studentAccessForm: $("#student-access-form"),
    studentAccessName: $("#student-access-name"),
    studentAccessCode: $("#student-access-code"),
    studentAccessEntry: $("#student-access-entry"),
    manualStudentAccessFields: $("#manual-student-access-fields"),
    studentAccessStatus: $("#student-access-status"),
    redeemStudentAccess: $("#redeem-student-access"),
    studentAccessDialog: $("#student-access-dialog"),
    studentAccessTitle: $("#student-access-title"),
    studentAccessQr: $("#student-access-qr"),
    studentAccessLink: $("#student-access-link"),
    generatedStudentAccessCode: $("#generated-student-access-code"),
    generatedStudentAccessStatus: $("#generated-student-access-status"),
    copyStudentAccessLink: $("#copy-student-access-link"),
    copyStudentAccessCode: $("#copy-student-access-code"),
    closeStudentAccess: $("#close-student-access")
  });
  Object.assign(els, {
    studentManagementDialog: $("#student-management-dialog"),
    studentManagementTitle: $("#student-management-title"),
    studentDevicesTitle: $("#student-devices-title"),
    studentDeviceList: $("#student-device-list"),
    studentAuditList: $("#student-audit-list"),
    studentLifecycleDescription: $("#student-lifecycle-description"),
    toggleStudentActive: $("#toggle-student-active"),
    permanentDeletePanel: $("#permanent-delete-panel"),
    confirmStudentDeletion: $("#confirm-student-deletion"),
    deleteStudentPermanently: $("#delete-student-permanently"),
    studentManagementStatus: $("#student-management-status"),
    closeStudentManagement: $("#close-student-management")
  });
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

  function studentDeviceToken(studentId) {
    return store.read(`elevspor.studentDevice.${studentId}`, "");
  }

  async function recordBackendActivity(type, durationSeconds) {
    const backend = globalThis.ElevsporSupabase;
    const progress = currentProgress();
    if (!backend?.configured || !state.studentId || !progress) return;
    try {
      const deviceToken = studentDeviceToken(state.studentId);
      if (deviceToken) {
        await backend.recordStudentDeviceActivity(deviceToken, type, durationSeconds);
        return;
      }
      const student = currentStudent();
      if (student?.backendId) {
        await backend.recordStaffStudentActivity(student.backendId, type, durationSeconds);
        return;
      }
      await backend.recordActivity(
        backendLocalStudentId(state.studentId),
        type,
        durationSeconds,
        progress.birthYear || null,
        currentStudent()?.name || null
      );
    } catch (error) {
      console.warn("Elevspor-aktivitet kunne ikke synkroniseres", error);
    }
  }

  async function loadStudentApproval() {
    const backend = globalThis.ElevsporSupabase;
    const progress = currentProgress();
    if (!backend?.configured) return { status: "unavailable", message: "Skolens forbindelse er ikke konfigureret." };
    try {
      const deviceToken = studentDeviceToken(state.studentId);
      if (deviceToken) {
        const device = await backend.getStudentDeviceStatus(deviceToken);
        state.approval = { approval_status: device.status, id: device.student_id };
        return {
          status: device.status,
          student: state.approval,
          message: "Din enhed er godkendt. Du kan gå i gang."
        };
      }
      if (!await backend.getSession()) {
        return { status: "unavailable", message: "Brug din elevkode eller bed en lærer om at åbne elevområdet." };
      }
      const syncedStudent = currentStudent()?.remoteApproval;
      if (syncedStudent) {
        state.approval = syncedStudent;
        const status = syncedStudent.approval_status === "approved" && !syncedStudent.active
          ? "inactive"
          : syncedStudent.approval_status;
        return {
          status,
          student: syncedStudent,
          message: status === "approved"
            ? "Godkendt af en lærer. Du kan gå i gang."
            : status === "inactive"
              ? "Elevprofilen er deaktiveret af skolen."
              : "Din tilmelding venter på en lærers godkendelse."
        };
      }
      const student = await backend.getStudentApproval(
        backendLocalStudentId(state.studentId),
        progress.birthYear || null,
        currentStudent()?.name || null
      );
      state.approval = student;
      const status = student.approval_status === "approved" && !student.active
        ? "inactive"
        : student.approval_status;
      return {
        status,
        student,
        message: status === "inactive"
          ? "Elevprofilen er deaktiveret af skolen."
          : student.approval_status === "approved"
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

  async function syncSchoolStudents(backend) {
    const remoteStudents = await backend.listSchoolStudents();
    const localByBackendId = new Map(
      STUDENTS.filter(student => student.backendId).map(student => [student.backendId, student])
    );
    const localByHash = new Map();
    for (const student of STUDENTS) {
      const reference = backendLocalStudentId(student.id);
      localByHash.set(await backend.hashLocalReference(reference), student);
    }
    for (const remote of remoteStudents) {
      let student = localByBackendId.get(remote.id) || localByHash.get(remote.local_reference_hash);
      if (!student) {
        student = {
          id: typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: remote.display_name || "Elev uden navn",
          avatar: "🎯",
          profile: "Elevprofil",
          levels: defaultLevels()
        };
        STUDENTS.push(student);
      }
      student.backendId = remote.id;
      if (remote.display_name) student.name = remote.display_name;
      const progress = state.progress[student.id] || createProgress(student);
      if (remote.birth_year) progress.birthYear = remote.birth_year;
      state.progress[student.id] = progress;
      student.remoteApproval = remote;
    }
    saveLocalStudents();
    saveProgress();
  }

  function removeLocalStudent(studentId) {
    const index = STUDENTS.findIndex(student => student.id === studentId);
    if (index >= 0) STUDENTS.splice(index, 1);
    delete state.progress[studentId];
    localStorage.removeItem(`elevspor.backendStudent.${studentId}`);
    localStorage.removeItem(`elevspor.studentDevice.${studentId}`);
    if (state.studentId === studentId) state.studentId = "";
    saveLocalStudents();
    saveProgress();
  }

  async function openStudentAccess(student, backendStudentId, button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Opretter adgang…";
    try {
      const access = await globalThis.ElevsporSupabase.createStudentAccess(backendStudentId);
      const progress = state.progress[student.id] || {};
      const url = new URL(location.href);
      url.search = "";
      url.hash = `/elev-adgang/${access.token}`;
      const link = url.toString();
      els.studentAccessTitle.textContent = `Elevadgang til ${studentIdentityLabel(student, progress.birthYear)}`;
      els.studentAccessLink.value = link;
      els.generatedStudentAccessCode.textContent = access.code;
      els.studentAccessQr.src = await globalThis.ElevsporQr.toDataUrl(link);
      els.generatedStudentAccessStatus.textContent = "Adgangen er klar og udløber om 15 minutter.";
      if (typeof els.studentAccessDialog.showModal === "function") els.studentAccessDialog.showModal();
      else els.studentAccessDialog.setAttribute("open", "");
    } catch (error) {
      button.textContent = `Adgang mislykkedes: ${error.message}`;
    } finally {
      button.disabled = false;
      if (button.textContent === "Opretter adgang…") button.textContent = originalText;
    }
  }

  async function completeStudentAccess(secret, profile) {
    const access = await globalThis.ElevsporSupabase.redeemStudentAccess(secret);
    const id = access.student_id || (
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    let student = STUDENTS.find(item => item.id === id);
    if (!student) {
      student = {
        id,
        name: profile.name,
        avatar: profile.avatar || "🎯",
        profile: "Elevprofil",
        levels: defaultLevels()
      };
      STUDENTS.push(student);
      saveLocalStudents();
    }
    state.studentId = id;
    const progress = currentProgress();
    store.write(`elevspor.studentDevice.${id}`, access.device_token);
    saveProgress();
    state.pendingStudentAccessSecret = "";
    els.studentAccessCode.value = "";
    history.replaceState({}, "", location.pathname);
    els.studentAccessStatus.dataset.status = "success";
    els.studentAccessStatus.textContent = "Adgangen er godkendt. Åbner dit elevområde… ✓";
    await renderStudent();
  }

  function formatDeviceDate(value) {
    return new Intl.DateTimeFormat("da-DK", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function renderStudentAudit(events = []) {
    els.studentAuditList.replaceChildren();
    const labels = {
      device_removed: "Enhed fjernet",
      student_deactivated: "Elev deaktiveret",
      student_reactivated: "Elev genaktiveret",
      student_deleted: "Elev slettet permanent"
    };
    if (!events.length) {
      emptyStudentGroup(els.studentAuditList, "Ingen administrative ændringer endnu.");
      return;
    }
    events.forEach(event => {
      const item = document.createElement("article");
      item.className = "student-audit-item";
      const title = document.createElement("strong");
      title.textContent = labels[event.action] || "Elev ændret";
      const details = document.createElement("p");
      details.textContent = `${event.actor_name} · ${formatDeviceDate(event.occurred_at)}`;
      item.append(title, details);
      els.studentAuditList.append(item);
    });
  }

  function renderStudentManagement(entry) {
    state.managedStudentEntry = entry;
    const progress = state.progress[entry.student.id] || {};
    const identity = studentIdentityLabel(entry.student, progress.birthYear);
    const inactive = entry.approval.status === "inactive";
    els.studentManagementTitle.textContent = identity;
    els.studentDeviceList.replaceChildren();
    renderStudentAudit(entry.auditEvents || []);
    const activeDevices = (entry.devices || []).filter(device => !device.revoked_at);
    els.studentDevicesTitle.textContent = `Aktive enheder (${activeDevices.length})`;
    if (!activeDevices.length) {
      emptyStudentGroup(
        els.studentDeviceList,
        "Ingen aktive enheder. Opret en ny elevadgang, når eleven skal tilknytte en enhed."
      );
    }
    activeDevices.forEach((device, index) => {
      const item = document.createElement("article");
      item.className = "student-device-item";
      item.innerHTML = `<div><strong>Elev-enhed ${index + 1}</strong><p>Senest aktiv ${formatDeviceDate(device.last_used_at)}</p></div>`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary-button";
      remove.textContent = "Fjern enhed";
      remove.addEventListener("click", async () => {
        remove.disabled = true;
        try {
          await globalThis.ElevsporSupabase.revokeStudentDevice(device.id);
          device.revoked_at = new Date().toISOString();
          entry.auditEvents = await globalThis.ElevsporSupabase.listStudentAuditEvents(
            entry.approval.student.id
          );
          renderStudentManagement(entry);
          els.studentManagementStatus.textContent = "Enheden er fjernet og kan ikke længere åbne elevområdet. ✓";
        } catch (error) {
          els.studentManagementStatus.textContent = `Enheden kunne ikke fjernes: ${error.message}`;
          remove.disabled = false;
        }
      });
      item.append(remove);
      els.studentDeviceList.append(item);
    });
    els.studentLifecycleDescription.textContent = inactive
      ? "Eleven er deaktiveret. Historik bevares, men ingen enheder har adgang."
      : "Deaktivering lukker alle elevens enheder, men bevarer historikken.";
    els.toggleStudentActive.textContent = inactive ? "Genaktivér elev" : "Deaktivér elev";
    els.toggleStudentActive.dataset.nextActive = inactive ? "true" : "false";
    els.permanentDeletePanel.hidden = !state.canManageStaff;
    els.confirmStudentDeletion.value = "";
    els.confirmStudentDeletion.dataset.expected = identity;
    els.deleteStudentPermanently.disabled = true;
    els.studentManagementStatus.textContent = "";
  }

  async function openStudentManagement(entry) {
    renderStudentManagement(entry);
    if (typeof els.studentManagementDialog.showModal === "function") els.studentManagementDialog.showModal();
    else els.studentManagementDialog.setAttribute("open", "");
    els.studentAuditList.replaceChildren();
    emptyStudentGroup(els.studentAuditList, "Henter ændringer…");
    try {
      entry.auditEvents = await globalThis.ElevsporSupabase.listStudentAuditEvents(
        entry.approval.student.id
      );
      renderStudentAudit(entry.auditEvents);
    } catch (error) {
      els.studentAuditList.replaceChildren();
      emptyStudentGroup(
        els.studentAuditList,
        `Auditsporet kunne ikke hentes: ${error.message}`
      );
    }
  }

  async function redeemStudentAccessFromHash() {
    if (!location.hash.startsWith("#/elev-adgang")) return false;
    const match = location.hash.match(/^#\/elev-adgang\/([a-f0-9]{48})$/);
    history.replaceState({}, "", location.pathname);
    showView("welcome");
    els.studentAccessEntry.open = true;
    els.manualStudentAccessFields.hidden = Boolean(match);
    els.studentAccessCode.required = !match;
    if (!match) {
      state.pendingStudentAccessSecret = "";
      els.studentAccessStatus.dataset.status = "error";
      els.studentAccessStatus.textContent =
        "Linket er ugyldigt. Skriv en engangskode, eller bed læreren om et nyt link.";
      els.studentAccessCode.focus();
      return false;
    }
    state.pendingStudentAccessSecret = match[1];
    els.studentAccessStatus.dataset.status = "loading";
    els.studentAccessStatus.textContent =
      "Linket er klar. Skriv dit fornavn for at åbne elevområdet.";
    els.studentAccessName.focus();
    return true;
  }

  function showSchoolPage(name, options = {}) {
    if (!SCHOOL_ROUTES[name]) name = "students";
    if (["staff", "audit"].includes(name) && !state.canManageStaff) name = "students";
    els.schoolPages.forEach(page => { page.hidden = page.id !== `${name}-page`; });
    els.schoolNavButtons.forEach(button => {
      const active = button.dataset.schoolPage === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    store.write("elevspor.lastSchoolPage", name);
    const nextHash = schoolHashForPage(name);
    if (options.updateRoute !== false && location.hash !== nextHash) {
      const nextUrl = `${location.pathname}${location.search}${nextHash}`;
      if (options.replace) history.replaceState({}, "", nextUrl);
      else history.pushState({}, "", nextUrl);
    }
    const pageLabel = els.schoolNavButtons
      .find(button => button.dataset.schoolPage === name)?.textContent || "Lærerområde";
    document.title = `${pageLabel} · Elevspor`;
    if (name === "audit") void loadSchoolAudit();
  }

  function setAdminOnboardingVisible(visible) {
    els.adminOnboarding.hidden = !visible;
    els.showAdminOnboarding.textContent = visible ? "Guiden er åben" : "Kom godt i gang";
    els.showAdminOnboarding.disabled = visible;
  }

  function setTestCheck(indicator, textElement, status, message) {
    indicator.dataset.status = status;
    indicator.textContent = status === "complete" ? "✓" : status === "unknown" ? "?" : "○";
    textElement.textContent = message;
  }

  function renderManualTestChecks() {
    const context = state.testChecklistContext;
    if (!context) return;
    const saved = store.read(context.storageKey, {});
    els.testCheckTeacherReview.checked = Boolean(saved.teacherReview);
    els.testCheckAuditReview.checked = Boolean(saved.auditReview);
    const complete = els.testCheckTeacherReview.checked && els.testCheckAuditReview.checked;
    els.testCheckReview.dataset.status = complete ? "complete" : "manual";
    els.testCheckReview.textContent = complete ? "✓" : "○";
  }

  async function refreshTestChecklist() {
    const context = state.testChecklistContext;
    if (!context) return;
    els.refreshTestChecklist.disabled = true;
    els.testChecklistStatus.dataset.status = "loading";
    els.testChecklistStatus.textContent = "Kontrollerer Test-Skoles aktuelle tilstand…";
    const testEntry = context.entries.find(entry =>
      entry.student.name.trim().toLocaleLowerCase("da") === "test-elev"
    );
    try {
      if (!testEntry) {
        setTestCheck(
          els.testCheckTeacher,
          els.testCheckTeacherText,
          "pending",
          "Test-Elev findes ikke på denne enhed. Opret profilen for at starte testen."
        );
        setTestCheck(
          els.testCheckDevice,
          els.testCheckDeviceText,
          "pending",
          "Ingen aktiv enhed fundet. Indløs en ny QR-kode, link eller kode på elevens enhed."
        );
        setTestCheck(
          els.testCheckActivity,
          els.testCheckActivityText,
          "pending",
          "Aktivitet kan først kontrolleres, når Test-Elev er godkendt."
        );
        els.testChecklistStatus.dataset.status = "";
        els.testChecklistStatus.textContent = "Testforløbet er ikke færdigt endnu.";
        return;
      }
      const progress = state.progress[testEntry.student.id] || {};
      const freshStudent = await globalThis.ElevsporSupabase.getStudentApproval(
        backendLocalStudentId(testEntry.student.id),
        progress.birthYear || null,
        testEntry.student.name
      );
      const freshStatus = freshStudent.approval_status === "approved" && !freshStudent.active
        ? "inactive"
        : freshStudent.approval_status;
      testEntry.approval = { status: freshStatus, student: freshStudent };
      testEntry.devices = ["approved", "inactive"].includes(freshStatus)
        ? await globalThis.ElevsporSupabase.listStudentDevices(freshStudent.id)
        : [];
      const approved = freshStatus === "approved";
      setTestCheck(
        els.testCheckTeacher,
        els.testCheckTeacherText,
        approved ? "complete" : "pending",
        approved
          ? "Test-Elev er godkendt på Test-Skole."
          : "Test-Elev mangler stadig lærerens godkendelse."
      );
      const activeDevice = approved && testEntry.devices.some(device => !device.revoked_at);
      setTestCheck(
        els.testCheckDevice,
        els.testCheckDeviceText,
        activeDevice ? "complete" : "pending",
        activeDevice
          ? "Serveren har fundet en aktiv enhed til Test-Elev."
          : "Ingen aktiv enhed fundet. Indløs en ny QR-kode, link eller kode på elevens enhed."
      );
      if (!approved) {
        setTestCheck(
          els.testCheckActivity,
          els.testCheckActivityText,
          "pending",
          "Aktivitet kan først kontrolleres, når Test-Elev er godkendt."
        );
        els.testChecklistStatus.dataset.status = "";
        els.testChecklistStatus.textContent = "Testforløbet er ikke færdigt endnu.";
        return;
      }
      const activities = await globalThis.ElevsporSupabase.listStudentActivities([
        freshStudent.id
      ]);
      const completed = activities.some(item => item.activity_type === "conversation_completed");
      setTestCheck(
        els.testCheckActivity,
        els.testCheckActivityText,
        completed ? "complete" : "pending",
        completed
          ? "Serveren har registreret en gennemført øvelse for Test-Elev."
          : "Ingen gennemført øvelse fundet. Gennemfør en samtale på elevens enhed."
      );
      els.testChecklistStatus.dataset.status = completed && activeDevice ? "success" : "";
      els.testChecklistStatus.textContent = completed && activeDevice
        ? "De automatiske kontroller består. Afslut med de to tydeligt manuelle kontroller."
        : "Testforløbet er ikke færdigt endnu.";
    } catch (_) {
      setTestCheck(
        els.testCheckActivity,
        els.testCheckActivityText,
        "unknown",
        "Aktiviteten kunne ikke kontrolleres lige nu. Ingen status er antaget."
      );
      els.testChecklistStatus.dataset.status = "error";
      els.testChecklistStatus.textContent = "En læsekontrol fejlede. Prøv igen — checklisten har ikke ændret data.";
    } finally {
      els.refreshTestChecklist.disabled = false;
      renderManualTestChecks();
    }
  }

  const AUDIT_ACTION_LABELS = Object.freeze({
    device_removed: "Enhed fjernet",
    student_deactivated: "Elev deaktiveret",
    student_reactivated: "Elev genaktiveret",
    student_deleted: "Elev slettet permanent"
  });

  function auditStudentLabel(studentId) {
    return state.schoolAuditStudentLabels.get(studentId) || "Slettet eller ukendt elev";
  }

  function renderSchoolAudit(events) {
    els.schoolAuditList.replaceChildren();
    if (!events.length) {
      const filtersActive = [
        els.auditFrom.value,
        els.auditTo.value,
        els.auditActor.value,
        els.auditStudent.value,
        els.auditAction.value
      ].some(Boolean);
      emptyStudentGroup(
        els.schoolAuditList,
        filtersActive
          ? "Ingen ændringer matcher filtrene. Nulstil filtrene for at se hele loggen."
          : "Ingen administrative ændringer endnu. Loggen udfyldes, når elevadgang eller elevstatus ændres."
      );
      return;
    }
    events.forEach(event => {
      const item = document.createElement("article");
      item.className = "school-audit-item";
      const when = document.createElement("time");
      when.dateTime = event.occurred_at;
      when.textContent = formatDeviceDate(event.occurred_at);
      const content = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = AUDIT_ACTION_LABELS[event.action] || "Administrativ ændring";
      const details = document.createElement("p");
      details.textContent = `${auditStudentLabel(event.subject_student_id)} · ${event.actor_name}`;
      content.append(title, details);
      item.append(when, content);
      els.schoolAuditList.append(item);
    });
  }

  function exclusiveDayAfter(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    date.setDate(date.getDate() + 1);
    return date.toISOString();
  }

  async function loadSchoolAudit() {
    if (!state.canManageStaff || !state.schoolId) return;
    els.schoolAuditStatus.textContent = "Henter auditspor…";
    els.exportSchoolAudit.disabled = true;
    try {
      const events = await globalThis.ElevsporSupabase.listSchoolAuditEvents(state.schoolId, {
        from: els.auditFrom.value ? new Date(`${els.auditFrom.value}T00:00:00`).toISOString() : null,
        to: exclusiveDayAfter(els.auditTo.value),
        actorId: els.auditActor.value,
        studentId: els.auditStudent.value,
        action: els.auditAction.value
      });
      state.schoolAuditEvents = events;
      const actors = [...new Map(events.filter(item => item.actor_id).map(item => [item.actor_id, item.actor_name])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "da"));
      const selectedActor = els.auditActor.value;
      els.auditActor.replaceChildren(new Option("Alle medarbejdere", ""));
      actors.forEach(([id, name]) => els.auditActor.add(new Option(name, id)));
      els.auditActor.value = selectedActor;
      renderSchoolAudit(events);
      els.schoolAuditStatus.textContent = `${events.length} ændringer fundet.`;
      els.exportSchoolAudit.disabled = !events.length;
    } catch (error) {
      state.schoolAuditEvents = [];
      els.schoolAuditList.replaceChildren();
      emptyStudentGroup(els.schoolAuditList, `Auditsporet kunne ikke hentes: ${error.message}`);
      els.schoolAuditStatus.textContent = "";
    }
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportSchoolAuditCsv() {
    const rows = [["Tidspunkt", "Handling", "Elev", "Medarbejder"], ...state.schoolAuditEvents.map(event => [
      event.occurred_at,
      AUDIT_ACTION_LABELS[event.action] || event.action,
      auditStudentLabel(event.subject_student_id),
      event.actor_name
    ])];
    const blob = new Blob([`\ufeff${rows.map(row => row.map(csvCell).join(";")).join("\r\n")}`], {
      type: "text/csv;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `elevspor-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function emptyStudentGroup(container, message, action = null) {
    const empty = document.createElement(action ? "div" : "p");
    empty.className = "student-list-empty";
    const copy = document.createElement("span");
    copy.textContent = message;
    empty.append(copy);
    if (action) {
      const button = document.createElement("button");
      button.className = "secondary-button";
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", action.run);
      empty.append(button);
    }
    container.append(empty);
  }

  function renderStudentAdminCard(entry, options = {}) {
    const { student, approval } = entry;
    const card = document.createElement("article");
    card.className = "student-admin-card";
    if (options.highlight) {
      card.classList.add("new-student-highlight");
      card.id = "newly-created-student";
    }
    const progress = state.progress[student.id] || {};
    const identity = studentIdentityLabel(student, progress.birthYear);
    const status = approval.status === "approved"
      ? "Godkendt"
      : approval.status === "inactive"
        ? "Deaktiveret"
      : approval.status === "pending"
        ? "Afventer lærerens godkendelse"
        : approval.message;
    card.innerHTML = `
      <div><strong>${student.avatar} ${student.name}</strong>
      <span class="student-identity-label">${identity}</span>
      <p>${status}</p></div>
      <div class="student-admin-actions"></div>`;
    const actions = card.querySelector(".student-admin-actions");
    if (approval.status === "pending") {
      const approve = document.createElement("button");
      approve.className = "primary-button";
      approve.type = "button";
      approve.textContent = "Godkend";
      approve.addEventListener("click", async () => {
        approve.disabled = true;
        approve.textContent = "Godkender…";
        try {
          await globalThis.ElevsporSupabase.approveStudent(approval.student.id);
          state.justApprovedStudentId = student.id;
          await renderSchoolDashboard("students");
        } catch (error) {
          card.querySelector("p").textContent = `Godkendelse mislykkedes: ${error.message}`;
          approve.disabled = false;
          approve.textContent = "Godkend";
        }
      });
      actions.append(approve);
    }
    if (approval.status === "approved") {
      const accessButton = document.createElement("button");
      accessButton.className = "primary-button";
      accessButton.type = "button";
      accessButton.textContent = "Opret elevadgang";
      accessButton.addEventListener("click", () => void openStudentAccess(student, approval.student.id, accessButton));
      actions.append(accessButton);
    }
    if (approval.student?.id && ["approved", "inactive"].includes(approval.status)) {
      const devicesButton = document.createElement("button");
      devicesButton.className = "secondary-button";
      devicesButton.type = "button";
      devicesButton.textContent = "Adgang og historik";
      devicesButton.setAttribute(
        "aria-label",
        `Adgang og historik for ${studentIdentityLabel(student, state.progress[student.id]?.birthYear)}`
      );
      devicesButton.addEventListener("click", () => void openStudentManagement(entry));
      actions.append(devicesButton);
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
    return card;
  }

  async function renderSchoolDashboard(page = "", highlightStudentId = "") {
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
    const canManageStaff = ["owner", "admin"].includes(membership.role);
    state.canManageStaff = canManageStaff;
    state.schoolId = membership.school_id;
    els.staffInvitationPanel.hidden = !canManageStaff;
    els.staffPageButton.hidden = !canManageStaff;
    els.auditPageButton.hidden = !canManageStaff;
    els.showAdminOnboarding.hidden = !canManageStaff;
    if (canManageStaff) {
      const onboardingKey = adminOnboardingStorageKey(membership.school_id, session.user.id);
      setAdminOnboardingVisible(!store.read(onboardingKey, false));
      els.dismissAdminOnboarding.dataset.storageKey = onboardingKey;
    } else {
      setAdminOnboardingVisible(false);
      els.dismissAdminOnboarding.dataset.storageKey = "";
    }
    page = page
      || schoolPageFromHash(location.hash)
      || store.read("elevspor.lastSchoolPage", "students");
    if (!canManageStaff && ["staff", "audit"].includes(page)) page = "students";
    await syncSchoolStudents(backend);
    const entries = [];
    for (const student of STUDENTS) {
      state.studentId = student.id;
      currentProgress();
      const remote = student.remoteApproval;
      const approval = remote
        ? {
            status: remote.approval_status === "approved" && !remote.active
              ? "inactive"
              : remote.approval_status,
            student: remote
          }
        : await loadStudentApproval();
      let devices = [];
      if (approval.student?.id && ["approved", "inactive"].includes(approval.status)) {
        try {
          devices = await backend.listStudentDevices(approval.student.id);
        } catch (_) {}
      }
      entries.push({ student, approval, devices });
    }
    state.schoolAuditStudentLabels = new Map(entries
      .filter(entry => entry.approval.student?.id)
      .map(entry => [
        entry.approval.student.id,
        studentIdentityLabel(entry.student, state.progress[entry.student.id]?.birthYear)
      ]));
    const selectedStudent = els.auditStudent.value;
    els.auditStudent.replaceChildren(new Option("Alle elever", ""));
    [...state.schoolAuditStudentLabels.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "da"))
      .forEach(([id, label]) => els.auditStudent.add(new Option(label, id)));
    els.auditStudent.value = selectedStudent;
    state.studentId = "";
    store.write("italk.selectedStudent", "");
    const pending = entries.filter(entry => entry.approval.status === "pending");
    const approved = entries.filter(entry => entry.approval.status === "approved")
      .sort((a, b) => new Date(b.approval.student?.approved_at || 0) - new Date(a.approval.student?.approved_at || 0));
    els.pendingStudentList.replaceChildren();
    els.recentStudentList.replaceChildren();
    els.allStudentList.replaceChildren();
    els.pendingStudentCount.textContent = `${pending.length} venter`;
    pending.forEach(entry => els.pendingStudentList.append(renderStudentAdminCard(entry, {
      highlight: entry.student.id === highlightStudentId
    })));
    approved.slice(0, 5).forEach(entry => els.recentStudentList.append(renderStudentAdminCard(entry, {
      highlight: entry.student.id === state.justApprovedStudentId
    })));
    entries.sort((a, b) => a.student.name.localeCompare(b.student.name, "da"))
      .forEach(entry => els.allStudentList.append(renderStudentAdminCard(entry)));
    if (!pending.length) emptyStudentGroup(
      els.pendingStudentList,
      "Alt er behandlet — ingen elever venter på godkendelse."
    );
    if (!approved.length) emptyStudentGroup(
      els.recentStudentList,
      "Ingen elever er godkendt endnu. Godkend en elev ovenfor, så vises eleven her."
    );
    if (!entries.length) emptyStudentGroup(
      els.allStudentList,
      "Skolen har ingen elever på denne enhed endnu.",
      { label: "Opret den første elev", run: () => showSchoolPage("create-student") }
    );
    els.studentSearch.value = "";
    els.studentSearchEmpty.hidden = true;
    const showTestChecklist = canManageStaff && isTestSchool(membership.schools?.name);
    els.testSchoolChecklist.hidden = !showTestChecklist;
    state.testChecklistContext = showTestChecklist
      ? {
          entries,
          storageKey: testChecklistStorageKey(membership.school_id, session.user.id)
        }
      : null;
    if (showTestChecklist) void refreshTestChecklist();
    showSchoolPage(page, { replace: Boolean(schoolPageFromHash(location.hash)) });
    showView("school-dashboard");
    const highlighted = document.querySelector(".new-student-highlight");
    if (highlighted) highlighted.scrollIntoView({ block: "center", behavior: "smooth" });
    state.justApprovedStudentId = "";
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
    if (!progress) return;
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
    // Elevnavnet hentes kun fra den lokale profil på enheden. Det sendes ikke
    // til backend sammen med aktiviteten eller resultatet.
    els.resultStudentName.textContent = `Elev: ${currentStudent().name}`;
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

  els.home.addEventListener("click", async () => {
    const session = await globalThis.ElevsporSupabase?.getSession();
    if (session) {
      await renderSchoolDashboard();
      return;
    }
    selectStudent("");
  });
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
    const localLabel = els.newStudentLabel.value.trim();
    const currentYear = new Date().getFullYear();
    if (!name || !Number.isInteger(birthYear) || birthYear < 1926 || birthYear > currentYear) {
      els.createStudentStatus.dataset.status = "error";
      els.createStudentStatus.textContent = `Skriv et navn og et fødselsår mellem 1926 og ${currentYear}.`;
      els.createStudentStatus.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const sameNameStudents = STUDENTS.filter(student =>
      student.name.localeCompare(name, "da", { sensitivity: "base" }) === 0
    );
    if (sameNameStudents.length && !localLabel) {
      els.createStudentStatus.dataset.status = "error";
      els.createStudentStatus.textContent =
        `Der findes allerede en elev med navnet ${name}. Tilføj klasse/hold eller et andet lokalt kendetegn.`;
      els.newStudentLabel.focus();
      return;
    }
    if (localLabel && sameNameStudents.some(student =>
      (student.localLabel || "").localeCompare(localLabel, "da", { sensitivity: "base" }) === 0
    )) {
      els.createStudentStatus.dataset.status = "error";
      els.createStudentStatus.textContent = `${name} · ${localLabel} findes allerede. Vælg et andet kendetegn.`;
      els.newStudentLabel.focus();
      return;
    }
    els.createStudentButton.disabled = true;
    els.createStudentButton.textContent = "Opretter elev…";
    els.createStudentStatus.dataset.status = "loading";
    els.createStudentStatus.textContent = "Opretter eleven sikkert på Test-Skole…";
    try {
      const id = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await globalThis.ElevsporSupabase.getStudentApproval(
        backendLocalStudentId(id),
        birthYear,
        name
      );
      const student = {
        id,
        name,
        localLabel,
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
      els.createStudentForm.reset();
      await renderSchoolDashboard("students", id);
      els.studentsPageStatus.dataset.status = "success";
      els.studentsPageStatus.textContent = `${name} er oprettet. Godkend eleven under “Mangler godkendelse”. ✓`;
    } catch (error) {
      els.createStudentStatus.dataset.status = "error";
      els.createStudentStatus.textContent = `Eleven blev ikke oprettet: ${error.message}`;
      els.createStudentStatus.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } finally {
      els.createStudentButton.disabled = false;
      els.createStudentButton.textContent = "Opret elev til godkendelse";
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
  els.schoolNavButtons.forEach(button => {
    button.addEventListener("click", () => showSchoolPage(button.dataset.schoolPage));
  });
  els.schoolAuditFilters.addEventListener("submit", event => {
    event.preventDefault();
    void loadSchoolAudit();
  });
  els.resetSchoolAudit.addEventListener("click", () => {
    els.schoolAuditFilters.reset();
    void loadSchoolAudit();
  });
  els.exportSchoolAudit.addEventListener("click", exportSchoolAuditCsv);
  window.addEventListener("popstate", () => {
    if (document.querySelector("#school-dashboard-view").hidden) return;
    const page = schoolPageFromHash(location.hash);
    if (page) showSchoolPage(page, { updateRoute: false });
    else showSchoolPage(store.read("elevspor.lastSchoolPage", "students"), { replace: true });
  });
  els.studentSearch.addEventListener("input", () => {
    const query = els.studentSearch.value.trim().toLocaleLowerCase("da");
    const cards = Array.from(els.allStudentList.querySelectorAll(".student-admin-card"));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = Boolean(query) && !card.textContent.toLocaleLowerCase("da").includes(query);
      if (!card.hidden) visible += 1;
    });
    els.studentSearchEmpty.hidden = !query || visible > 0;
  });
  els.studentAccessForm.addEventListener("submit", async event => {
    event.preventDefault();
    const secret = state.pendingStudentAccessSecret
      || normalizeStudentAccessSecret(els.studentAccessCode.value);
    if (!state.pendingStudentAccessSecret && secret.length !== 12) {
      els.studentAccessStatus.dataset.status = "error";
      els.studentAccessStatus.textContent =
        "Koden skal have 12 bogstaver eller tal, fx AB12-CD34-EF56.";
      els.studentAccessCode.focus();
      return;
    }
    els.redeemStudentAccess.disabled = true;
    els.studentAccessStatus.dataset.status = "loading";
    els.studentAccessStatus.textContent = "Kontrollerer den sikre engangsadgang…";
    try {
      await completeStudentAccess(secret, {
        name: els.studentAccessName.value.trim(),
        avatar: "🎯"
      });
    } catch (error) {
      els.studentAccessStatus.dataset.status = "error";
      els.studentAccessStatus.textContent = studentAccessErrorMessage(
        error,
        typeof navigator === "undefined" || navigator.onLine !== false
      );
    } finally {
      els.redeemStudentAccess.disabled = false;
    }
  });
  els.closeStudentAccess.addEventListener("click", () => els.studentAccessDialog.close());
  els.copyStudentAccessLink.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.studentAccessLink.value);
    els.generatedStudentAccessStatus.textContent = "Engangslinket er kopieret ✓";
  });
  els.copyStudentAccessCode.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.generatedStudentAccessCode.textContent);
    els.generatedStudentAccessStatus.textContent = "Engangskoden er kopieret ✓";
  });
  els.closeStudentManagement.addEventListener("click", () => els.studentManagementDialog.close());
  els.toggleStudentActive.addEventListener("click", async () => {
    const entry = state.managedStudentEntry;
    if (!entry?.approval.student?.id) return;
    const nextActive = els.toggleStudentActive.dataset.nextActive === "true";
    if (!nextActive && !window.confirm(
      "Deaktivér eleven? Alle elevens enheder mister adgang. Historikken bevares."
    )) return;
    els.toggleStudentActive.disabled = true;
    els.studentManagementStatus.textContent = nextActive ? "Genaktiverer eleven…" : "Deaktiverer eleven…";
    try {
      await globalThis.ElevsporSupabase.setStudentActive(entry.approval.student.id, nextActive);
      els.studentManagementDialog.close();
      await renderSchoolDashboard("students");
      els.studentsPageStatus.dataset.status = "success";
      els.studentsPageStatus.textContent = nextActive
        ? `${entry.student.name} er genaktiveret. Opret en ny elevadgang til enheden. ✓`
        : `${entry.student.name} er deaktiveret, og alle enheder er fjernet. ✓`;
    } catch (error) {
      els.studentManagementStatus.textContent = `Elevstatus kunne ikke ændres: ${error.message}`;
    } finally {
      els.toggleStudentActive.disabled = false;
    }
  });
  els.confirmStudentDeletion.addEventListener("input", () => {
    els.deleteStudentPermanently.disabled =
      els.confirmStudentDeletion.value.trim() !== els.confirmStudentDeletion.dataset.expected;
  });
  els.deleteStudentPermanently.addEventListener("click", async () => {
    const entry = state.managedStudentEntry;
    if (!entry?.approval.student?.id || els.deleteStudentPermanently.disabled) return;
    els.deleteStudentPermanently.disabled = true;
    els.studentManagementStatus.textContent = "Sletter elevens data permanent…";
    try {
      await globalThis.ElevsporSupabase.deleteStudentPermanently(entry.approval.student.id);
      removeLocalStudent(entry.student.id);
      els.studentManagementDialog.close();
      await renderSchoolDashboard("students");
      els.studentsPageStatus.dataset.status = "success";
      els.studentsPageStatus.textContent = `${entry.student.name} er slettet permanent.`;
    } catch (error) {
      els.studentManagementStatus.textContent = `Eleven kunne ikke slettes: ${error.message}`;
      els.confirmStudentDeletion.dispatchEvent(new Event("input"));
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
      els.openSchoolDashboard.hidden = true;
      return;
    }
    try {
      const session = await backend.getSession();
      if (!session) {
        els.schoolSessionStatus.textContent = "Ikke logget ind.";
        els.schoolLoginForm.hidden = false;
        els.openSchoolDashboard.hidden = true;
        const accessParams = new URLSearchParams(location.search);
        els.invitedSignupPanel.hidden = !accessParams.has("invite") && !accessParams.has("bootstrap");
        els.schoolSignout.hidden = true;
        return;
      }
      const membership = await backend.getMembership();
      els.schoolLoginForm.hidden = true;
      els.schoolSignout.hidden = false;
      if (membership) {
        const schoolName = membership.schools?.name || "skolen";
        els.schoolSessionStatus.textContent = `Forbundet til ${schoolName} · ${membership.role}`;
        els.openSchoolDashboard.hidden = false;
        els.invitedSignupPanel.hidden = true;
        await renderSchoolDashboard();
      } else {
        els.openSchoolDashboard.hidden = true;
        const pendingAccess = store.read("elevspor.pendingStaffAccess", null);
        if (!pendingAccess?.token) {
          els.schoolSessionStatus.textContent = "Kontoen er ikke knyttet til en skole. Kontakt skoleadministratoren.";
          return;
        }
        els.schoolSessionStatus.textContent = "Kontrollerer invitation…";
        if (pendingAccess.type === "bootstrap") {
          await backend.claimSchoolBootstrap(pendingAccess.token);
        } else {
          await backend.claimSchoolInvitation(pendingAccess.token);
        }
        localStorage.removeItem("elevspor.pendingStaffAccess");
        history.replaceState({}, "", location.pathname);
        await refreshSchoolSession();
      }
    } catch (error) {
      els.schoolSessionStatus.textContent = `Forbindelsesfejl: ${error.message}`;
    }
  }

  function rememberStaffAccessFromUrl() {
    const accessParams = new URLSearchParams(location.search);
    const bootstrapToken = accessParams.get("bootstrap");
    const inviteToken = accessParams.get("invite");
    if (!bootstrapToken && !inviteToken) return;
    store.write("elevspor.pendingStaffAccess", {
      type: bootstrapToken ? "bootstrap" : "invite",
      token: bootstrapToken || inviteToken
    });
  }

  els.schoolLoginForm.addEventListener("submit", async event => {
    event.preventDefault();
    els.schoolSessionStatus.textContent = "Logger ind…";
    try {
      rememberStaffAccessFromUrl();
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
  els.openSchoolDashboard.addEventListener("click", async () => {
    els.openSchoolDashboard.disabled = true;
    try {
      await renderSchoolDashboard();
    } finally {
      els.openSchoolDashboard.disabled = false;
    }
  });
  els.showAdminOnboarding.addEventListener("click", () => {
    setAdminOnboardingVisible(true);
    els.adminOnboarding.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  document.querySelectorAll("[data-test-checklist-page]").forEach(button => {
    button.addEventListener("click", () => showSchoolPage(button.dataset.testChecklistPage));
  });
  [els.testCheckTeacherReview, els.testCheckAuditReview].forEach(input => {
    input.addEventListener("change", () => {
      const context = state.testChecklistContext;
      if (!context) return;
      store.write(context.storageKey, {
        teacherReview: els.testCheckTeacherReview.checked,
        auditReview: els.testCheckAuditReview.checked
      });
      renderManualTestChecks();
    });
  });
  els.resetTestChecklistManual.addEventListener("click", () => {
    const context = state.testChecklistContext;
    if (!context) return;
    store.write(context.storageKey, {});
    renderManualTestChecks();
  });
  els.refreshTestChecklist.addEventListener("click", () => void refreshTestChecklist());
  els.dismissAdminOnboarding.addEventListener("click", () => {
    const storageKey = els.dismissAdminOnboarding.dataset.storageKey;
    if (storageKey) store.write(storageKey, true);
    setAdminOnboardingVisible(false);
  });
  els.startAdminOnboarding.addEventListener("click", () => {
    showSchoolPage("create-student");
    els.createStudentForm.scrollIntoView({ block: "start", behavior: "smooth" });
    els.newStudentName.focus();
  });
  els.schoolSignup.addEventListener("click", async () => {
    const accessParams = new URLSearchParams(location.search);
    const inviteToken = accessParams.get("invite");
    const bootstrapToken = accessParams.get("bootstrap");
    if (!inviteToken && !bootstrapToken) {
      els.schoolSessionStatus.textContent = "En gyldig invitation er påkrævet.";
      return;
    }
    if (!els.schoolLoginForm.reportValidity()) return;
    els.schoolSessionStatus.textContent = "Kontrollerer invitation og opretter medarbejder…";
    try {
      rememberStaffAccessFromUrl();
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
      localStorage.removeItem("elevspor.pendingStaffAccess");
      els.schoolSessionStatus.textContent = `Oprettelse mislykkedes: ${error.message}`;
    }
  });
  els.staffInvitationForm.addEventListener("submit", async event => {
    event.preventDefault();
    els.staffInvitationStatus.textContent = "Opretter invitation…";
    try {
      const membership = await globalThis.ElevsporSupabase.getMembership();
      const token = await globalThis.ElevsporSupabase.createSchoolInvitation(
        membership.school_id,
        els.staffInvitationEmail.value.trim(),
        els.staffInvitationRole.value
      );
      const url = new URL(location.href);
      url.search = "";
      url.hash = "";
      url.searchParams.set("invite", token);
      els.staffInvitationLink.value = url.toString();
      els.staffInvitationEmpty.hidden = true;
      els.staffInvitationResult.hidden = false;
      els.staffInvitationStatus.textContent = "Invitationen er klar og udløber efter 7 dage.";
    } catch (error) {
      els.staffInvitationStatus.textContent = `Invitationen kunne ikke oprettes: ${error.message}`;
    }
  });
  els.copyStaffInvitation.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.staffInvitationLink.value);
    els.staffInvitationStatus.textContent = "Linket er kopieret ✓";
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
    history.replaceState({}, "", location.pathname);
    document.title = "Elevspor – samtaletræning";
    showView("welcome");
    await refreshSchoolSession();
  });

  showView("welcome");
  void redeemStudentAccessFromHash();
  void refreshSchoolSession();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./service-worker.js");
        await registration.update();
      } catch (_) {}
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
