/* =========================================================
   ROSETTA EXPERIMENT — UNIT 1
   ========================================================= */

"use strict";

const CHAT_API_URL = "https://rosetta-linguistics.vercel.app/api/chat";
const $ = (id) => document.getElementById(id);


/* ---------- Content ---------- */

const EXAMPLES = {
  dabida: [
    ["dichakadhana", "We will fight"],
    ["bhichanirasha", "They will curse me"],
    ["kuchanikunda", "You (singular) will fall in love with me"],
    ["dichakurasha", "We will curse you (singular)"],
    ["dicharashana", "We will argue"],
    ["bhichamukunda", "They will fall in love with you (plural)"],
    ["muchadikadha", "You (plural) will beat us"],
    ["bhichakadhana", "They will fight"]
  ],
  zulu: [
    ["umdwebi", "Painter"],
    ["abadwebi", "Painters"],
    ["abazingeli", "Hunters"],
    ["zingela", "To hunt"],
    ["umbulali", "Killer"],
    ["ababazi", "Carvers"]
  ],
  swahili: [
    ["ninasema", "I speak"],
    ["wunasema", "You speak"],
    ["anasema", "She speaks"],
    ["wanasema", "They speak"],
    ["ninaona", "I see"],
    ["niliona", "I saw"],
    ["ninawaona", "I see them"],
    ["niliwuona", "I saw you"],
    ["ananiona", "She sees me"],
    ["wutakaniona", "You will see me"]
  ],
  latvian: [
    ["ozols", "Oak"],
    ["galds", "Table"],
    ["ābols", "Apple"],
    ["bērns", "Child"],
    ["veikala", "Of the shop"],
    ["institūta", "Of the institute"],
    ["ārsta", "Of the doctor"],
    ["ozola", "Of the oak"],
    ["autoru", "Of the authors"],
    ["bruņinieku", "Of the knights"]
  ]
};

// Answer keys (accents and punctuation are ignored when comparing).
const KEYS = {
  pre:  { apply: ["nichakukadha", "bhichakundana", "mucharashana"],
          transfer: ["kuchabhirasha", "dichamukunda"] },
  post: { apply: ["ābola", "bērna", "galda"],
          transfer: ["autora", "institūtu"] },
  swahili: ["aliwaona", "nitakawuona", "aliniona"]
};

const STEP_NAMES = ["Pre-test", "Discover", "Practise", "Post-test"];


/* ---------- State ---------- */

const mode = new URLSearchParams(location.search).get("mode") === "non-ai" ? "non-ai" : "ai";
const participantId = getParticipantId();

const data = {
  participant_id: participantId,
  experiment_mode: mode,
  unit: 1,
  started_at: new Date().toISOString(),
  completed_at: null,
  responses: {},
  events: [],
  scores: {}
};

let currentScreen = 0;
let stage = "not_started";          // not_started → pattern → rule → correction → complete
let chat = [];
let chatBusy = false;


/* ---------- Helpers ---------- */

function getParticipantId() {
  let id = localStorage.getItem("rosetta_participant_id");
  if (!id) {
    id = "P-" + Date.now().toString(36).toUpperCase() + "-" +
         Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem("rosetta_participant_id", id);
  }
  return id;
}

function save() {
  try {
    localStorage.setItem("rosetta_unit1_" + participantId, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save experiment data:", error);
  }
}

function log(event, details = {}) {
  data.events.push({ event, timestamp: new Date().toISOString(), details });
  save();
}

function answersOf(form) {
  const answers = {};
  new FormData(form).forEach((value, key) => { answers[key] = String(value).trim(); });
  return answers;
}

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const isCorrect = (answer, key) => normalise(answer) === normalise(key);

function gradeTest(answers, prefix, keys) {
  const count = (part) =>
    keys[part].filter((key, i) => isCorrect(answers[`${prefix}_${part}_${i + 1}`], key)).length;

  const apply = count("apply");
  const transfer = count("transfer");
  return {
    apply_score: apply, apply_maximum: keys.apply.length,
    transfer_score: transfer, transfer_maximum: keys.transfer.length,
    total: apply + transfer,
    maximum: keys.apply.length + keys.transfer.length
  };
}

function onSubmit(id, handler) {
  const form = $(id);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handler(form);
  });
}

function lock(form, buttonText) {
  form.querySelectorAll("input, textarea").forEach((el) => { el.disabled = true; });
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = buttonText;
}


/* ---------- Screens ---------- */

function showScreen(n) {
  document.querySelectorAll(".step").forEach((el) => el.classList.toggle("active", el.id === "screen-" + n));
  currentScreen = n;

  $("progress-label").textContent = n < 4 ? `Step ${n + 1} of 4 · ${STEP_NAMES[n]}` : "Complete";
  $("progress-fill").style.width = (n < 4 ? (n + 1) * 25 : 100) + "%";

  log("screen_opened", { screen: n });
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (n === 2 && stage === "not_started") {
    stage = "pattern";
    log("swahili_activity_opened");
  }
  if (n === 4) {
    data.completed_at = new Date().toISOString();
    save();
  }
}


/* ---------- Pre-test, Zulu, Post-test ---------- */

function initTests() {
  onSubmit("pretest-form", (form) => {
    const answers = answersOf(form);
    data.responses.pretest = answers;
    data.scores.pretest = gradeTest(answers, "pre", KEYS.pre);
    log("pretest_submitted", {
      score: data.scores.pretest.total,
      maximum: data.scores.pretest.maximum,
      rule_response: answers.pre_rule || ""
    });
    showScreen(1);
  });

  onSubmit("discover-form", (form) => {
    const answers = answersOf(form);
    data.responses.discover = answers;
    log("discover_response_saved", { response: answers.discover_response || "" });
    lock(form, "Observations saved");
    $("worked-example").hidden = false;
    $("continue-to-swahili").hidden = false;
  });

  onSubmit("posttest-form", (form) => {
    const answers = answersOf(form);
    data.responses.posttest = answers;
    data.scores.posttest = gradeTest(answers, "post", KEYS.post);
    log("posttest_submitted", {
      score: data.scores.posttest.total,
      maximum: data.scores.posttest.maximum,
      rule_response: answers.post_rule || ""
    });
    showScreen(4);
  });

  // "Continue" buttons that reveal the next block of a test
  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      $(button.dataset.reveal).hidden = false;
      button.hidden = true;
    });
  });
}


/* ---------- Swahili activity ---------- */

function initSwahili() {
  // Stage 1 — fill in the blanks
  onSubmit("swahili-form", (form) => {
    if (stage !== "pattern") return;

    const answers = answersOf(form);
    const correct = KEYS.swahili.map((key, i) => isCorrect(answers["swahili_" + (i + 1)], key));
    data.responses.swahili = answers;
    data.scores.swahili = { correct, total: correct.filter(Boolean).length, maximum: correct.length };

    correct.forEach((ok, i) => {
      const feedback = $("swahili-feedback-" + (i + 1));
      feedback.textContent = ok ? "Correct!" : "Incorrect.";
      feedback.className = "feedback " + (ok ? "correct" : "incorrect");
    });

    log("swahili_answers_submitted", {
      score: data.scores.swahili.total,
      maximum: correct.length,
      unanswered: Object.values(answers).filter((a) => a === "").length
    });

    lock(form, "Answers submitted");
    stage = "rule";
    $("rule-section").hidden = false;
    log("swahili_rule_stage_started");
  });

  // Stage 2 — write (and later revise) the rule
  onSubmit("rule-form", () => {
    if (stage !== "rule" && stage !== "correction") return;

    saveRule($("swahili-rule").value.trim());

    $("rule-form").querySelector("button").textContent = "Save revised rule";
    const status = $("rule-save-status");
    status.textContent = "Your rule has been saved.";
    status.hidden = false;

    if (stage === "rule") startCorrection();
  });

  // Hints are native <details> elements
  document.querySelectorAll(".hint").forEach((hint) => {
    hint.addEventListener("toggle", () => {
      log(hint.open ? "hint_opened" : "hint_closed", { hint_number: Number(hint.dataset.hint) });
    });
  });

  $("finish-swahili-button").addEventListener("click", finishSwahili);
}

function saveRule(text) {
  const r = data.responses;
  const now = new Date().toISOString();

  if (!("swahili_rule_initial" in r)) {
    r.swahili_rule_initial = text;
    r.swahili_rule_initial_timestamp = now;
    log("swahili_initial_rule_submitted", { rule: text, timestamp: now });
  } else {
    r.swahili_rule_revisions ??= [];
    const previous = r.swahili_rule_revisions.at(-1)?.text ?? r.swahili_rule_initial;

    if (text === previous) {
      log("swahili_rule_resubmitted_without_change");
    } else {
      r.swahili_rule_revisions.push({ text, timestamp: now });
      log("swahili_rule_revised", {
        rule: text,
        revision_number: r.swahili_rule_revisions.length,
        timestamp: now
      });
    }
  }

  r.swahili_rule = text;
  r.swahili_rule_latest_timestamp = now;
  save();
}

function startCorrection() {
  stage = "correction";
  log("swahili_correction_stage_started");

  $("hint-panel").hidden = false;
  $("ai-chat-panel").hidden = mode !== "ai";
  $("static-hints-panel").hidden = mode === "ai";

  if (mode === "ai") {
    chat = [];
    data.responses.swahili_chat = [];
    save();
  }
}

function finishSwahili() {
  if (stage === "complete") return;
  stage = "complete";
  log("swahili_activity_completed");

  data.responses.swahili_rule_latest_unsubmitted = $("swahili-rule").value.trim();
  save();

  $("chat-input").disabled = true;
  $("chat-send-button").disabled = true;
  $("chat-send-button").textContent = "Activity finished";

  const finish = $("finish-swahili-button");
  finish.disabled = true;
  finish.textContent = "Activity finished";

  $("swahili-completion-message").hidden = false;
  $("swahili-continue").hidden = false;
}


/* ---------- AI tutor ---------- */

function initChat() {
  const input = $("chat-input");

  // Enter sends, Shift+Enter inserts a new line
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      $("chat-form").requestSubmit();
    }
  });

  onSubmit("chat-form", async () => {
    const text = input.value.trim();
    if (mode !== "ai" || stage !== "correction" || chatBusy || !text) return;

    chat.push({ role: "user", content: text, timestamp: new Date().toISOString() });
    addBubble("user", text);
    input.value = "";
    data.responses.swahili_chat = chat;
    log("chat_message_sent", { message_number: chat.length });

    await requestReply();
  });
}

function addBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = "chat-message " + role;

  const name = document.createElement("strong");
  name.textContent = role === "user" ? "You" : "Rosetta tutor";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  bubble.append(name, paragraph);
  const log = $("chat-messages");
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function setChatBusy(busy, message = "") {
  chatBusy = busy;
  const enabled = !busy && stage === "correction";
  $("chat-input").disabled = !enabled;
  $("chat-send-button").disabled = !enabled;
  $("chat-send-button").textContent = busy ? "Tutor is thinking..." : "Send message →";

  const status = $("chat-status");
  status.textContent = message;
  status.hidden = !message;
}

async function requestReply() {
  setChatBusy(true, "The tutor is thinking...");

  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chat.map(({ role, content }) => ({ role, content })),
        currentRule: $("swahili-rule").value.trim(),
        participantId
      })
    });

    const reply = await response.json();
    if (!response.ok) throw new Error(reply.error || "The chatbot could not respond.");
    if (!reply.reply) throw new Error("The chatbot returned an empty response.");

    chat.push({ role: "assistant", content: reply.reply, timestamp: new Date().toISOString() });
    addBubble("assistant", reply.reply);
    data.responses.swahili_chat = chat;
    log("chat_reply_received", { message_number: chat.length });
    setChatBusy(false);

  } catch (error) {
    console.error("Chatbot error:", error);
    log("chat_request_failed", { error: String(error.message || error) });
    setChatBusy(false, "Sorry, the tutor could not respond. Please try again.");
  }
}


/* ---------- Download ---------- */

function downloadResponses() {
  data.exported_at = new Date().toISOString();
  save();

  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: `rosetta_unit1_${participantId}.json`
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  log("responses_downloaded");
}


/* ---------- Start ---------- */

document.body.dataset.experimentMode = mode;

// Render the example lists
document.querySelectorAll("[data-examples]").forEach((el) => {
  el.innerHTML = EXAMPLES[el.dataset.examples]
    .map(([word, meaning]) =>
      `<div class="example"><span class="word">${word}</span><span class="meaning">${meaning}</span></div>`)
    .join("");
});

// "Continue" buttons between screens
document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showScreen(Number(button.dataset.next)));
});

$("download-data").addEventListener("click", downloadResponses);
$("unit-2-button").addEventListener("click", () => {
  log("unit_2_requested");
  alert("Unit 2 is not available yet. Thank you for completing Unit 1!");
});

log("experiment_started", { mode });
initTests();
initSwahili();
initChat();
showScreen(0);
