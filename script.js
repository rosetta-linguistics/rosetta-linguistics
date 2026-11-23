/* =========================================================
   ROSETTA EXPERIMENT ENGINE
   Texts, examples and answer keys live in units.js.
   Participants: experiment.html?p=7  (odd number = with AI, even = without AI)
   Testing:      experiment.html?mode=ai|non-ai   (add &unit=2 to start at Unit 2)
   ========================================================= */

"use strict";

const CHAT_API_URL = "https://rosetta-linguistics.vercel.app/api/chat";
const GRADE_API_URL = "https://rosetta-linguistics.vercel.app/api/grade";
const STEP_NAMES = ["Pre-test", "Discover", "Practise", "Post-test"];
// Expected time shown next to a heading, in minutes.
const TIME = { test: 5, practice: 3 };

const $ = (id) => document.getElementById(id);
const esc = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);


/* ---------- Setup ---------- */

const params = new URLSearchParams(location.search);
// Participant number from the home page (?p=7). It decides the condition: odd = AI, even = non-AI.
const participantNumber = /^[1-9][0-9]{0,2}$/.test(params.get("p") || "") ? Number(params.get("p")) : null;
const mode = participantNumber
  ? (participantNumber % 2 ? "ai" : "non-ai")
  : (params.get("mode") === "non-ai" ? "non-ai" : "ai");      // testing links without a number
const unitNumber = UNITS[params.get("unit")] ? Number(params.get("unit")) : 1;
const unit = UNITS[unitNumber];
const practice = unit.practice;
const P = practice.prefix;                       // prefix for data keys, e.g. "swahili"
const participantId = getParticipantId();
const preTest = unit.pre;                        // same order for every participant
const postTest = unit.post;

const data = {
  participant_id: participantId,
  participant_number: participantNumber,          // null for testing runs
  experiment_mode: mode,
  unit: unitNumber,
  pre_test: preTest.name,
  post_test: postTest.name,
  started_at: new Date().toISOString(),
  completed_at: null,
  responses: {},
  events: [],
  scores: {}
};

let stage = "not_started";      // not_started → pattern → rule → correction → complete
let chat = [];
let chatBusy = false;
let lastField = null;           // last text field the participant used (for the character bar)
const grading = {};             // AI grading requests in progress, by "pre" / "post"


/* ---------- Helpers ---------- */

// A new ID for every run: starting Unit 1 is a new registration; later units
// receive the ID in the link (?pid=…), falling back to the one saved in this browser.
function getParticipantId() {
  const fromLink = params.get("pid");
  if (fromLink && /^P[0-9]*-[A-Z0-9-]+$/.test(fromLink)) {
    localStorage.setItem("rosetta_participant_id", fromLink);
    return fromLink;
  }
  let id = localStorage.getItem("rosetta_participant_id");
  if (!id || unitNumber === 1) {
    // e.g. P07-MWPH682H-MMPBSA (participant 7); testing runs have no number: P-…
    const number = participantNumber ? String(participantNumber).padStart(2, "0") : "";
    id = `P${number}-` + Date.now().toString(36).toUpperCase() + "-" +
         Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem("rosetta_participant_id", id);
  }
  return id;
}


function saveUnit(n, unitData) {
  try {
    localStorage.setItem(`rosetta_unit${n}_${participantId}`, JSON.stringify(unitData));
  } catch (error) {
    console.error(`Could not save Unit ${n} data:`, error);
  }
}

const save = () => saveUnit(unitNumber, data);

function log(event, details = {}) {
  data.events.push({ event, timestamp: new Date().toISOString(), details });
  save();
}

function answersOf(form) {
  const answers = {};
  new FormData(form).forEach((value, key) => { answers[key] = String(value).trim(); });
  return answers;
}

// Accents are ignored unless `keepAccents` is set; apostrophe variants count as the same letter.
function normalise(text, keepAccents) {
  let t = String(text || "").toLowerCase().normalize(keepAccents ? "NFC" : "NFD");
  if (!keepAccents) t = t.replace(/[̀-ͯ]/g, "");
  return t
    .replace(/[’‘ʼʔ`]/g, "'")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(answer, keys, keepAccents) {
  const given = normalise(answer, keepAccents);
  return [].concat(keys).some((key) => normalise(key, keepAccents) === given);
}

function gradeTest(test, prefix, answers) {
  const result = {};
  let total = 0;
  let maximum = 0;

  ["apply", "transfer"].forEach((part) => {
    const items = test[part]?.items;
    if (!items) return;

    const score = items.filter((item, i) =>
      isCorrect(answers[`${prefix}_${part}_${i + 1}`], item.key, test.strict)).length;

    result[`${part}_score`] = score;
    result[`${part}_maximum`] = items.length;
    total += score;
    maximum += items.length;
  });

  return { ...result, total, maximum };
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


/* ---------- Screen templates ---------- */

const durationHtml = (minutes) => ` <span class="duration">(approx. ${minutes} minutes)</span>`;

const introHtml = (heading, s) => `
  <div class="intro">
    <h1>${heading}</h1>
    ${s.letters ? `<p class="source">${s.letters}</p>` : ""}
    <p class="spotlight">
      <span class="flag" aria-hidden="true">${s.flag}</span>
      <span><strong>Language spotlight</strong> ${s.spotlight}</span>
    </p>
  </div>`;

function exampleHtml([word, meaning]) {
  const cells = [].concat(word);
  const multi = cells.length > 1;
  return `<div class="example${multi ? " multi" : ""}" style="--n:${cells.length}">` +
    cells.map((c) => `<span class="word${c.startsWith("_") ? " blank" : ""}">${esc(c)}</span>`).join("") +
    `<span class="meaning">${esc(meaning)}</span></div>`;
}

// Optional `columns` names each column of the examples table, e.g. ["Stem", "Now or past", "Meaning"].
const columnsHtml = (columns) => columns
  ? `<div class="example multi head" style="--n:${columns.length - 1}" aria-hidden="true">` +
    columns.map((c, i) => `<span${i === columns.length - 1 ? ' class="meaning-head"' : ""}>${esc(c)}</span>`).join("") +
    `</div>`
  : "";

const panelHtml = (s) => `
  <aside class="examples">
    <div class="panel">
      <h2 class="panel-title">${s.panelTitle}</h2>
      <div class="task"><strong>Your task</strong><p>${s.task}</p></div>
      <div>${columnsHtml(s.columns)}${s.examples.map(exampleHtml).join("")}</div>
    </div>
  </aside>`;

const charBarHtml = (chars) => chars?.length
  ? `<div class="chars" aria-label="Special characters"><span>Insert:</span>` +
    chars.map((c) => `<button type="button" data-char="${c}">${c}</button>`).join("") + `</div>`
  : "";

const inputAttrs = `autocomplete="off" autocapitalize="off" spellcheck="false"`;

const fieldsHtml = (prefix, items) => `<div class="fields">` +
  items.map((item, i) =>
    `<label>${esc(item.label)} <input name="${prefix}_${i + 1}" ${inputAttrs}></label>`).join("") +
  `</div>`;

// Pre-test and post-test: apply → transfer → rule, revealed one block at a time.
function testScreenHtml(test, prefix, screen) {
  const label = prefix === "pre" ? "Pre-test" : "Post-test";
  const blocks = ["apply", "transfer", "rule"].filter((name) => test[name]);
  const nextLabel = { apply: "apply", transfer: "transfer", rule: "the final question" };

  const body = blocks.map((name, i) => {
    const next = blocks[i + 1];
    let inner;
    if (name === "rule") {
      inner = `<label>Your explanation
        <textarea name="${prefix}_rule" placeholder="${esc(test.rule.placeholder)}"></textarea></label>`;
    } else {
      inner = (test[name].note ? `<p class="note">${test[name].note}</p>` : "") +
              fieldsHtml(`${prefix}_${name}`, test[name].items);
    }
    const button = next
      ? `<button type="button" class="btn" data-reveal="${prefix}-${next}">Continue to ${nextLabel[next]} →</button>`
      : `<button class="btn" type="submit">Submit ${label.toLowerCase()}</button>`;
    return `<div class="block" id="${prefix}-${name}"${i ? " hidden" : ""}>
      <h2>${test[name].title}</h2>${inner}${button}</div>`;
  }).join("");

  return `<section id="screen-${screen}" class="step">
    ${introHtml(`${label}: ${test.heading}${durationHtml(TIME.test)}`, test)}
    <div class="layout">${panelHtml(test)}
      <div class="activity">${charBarHtml(test.chars)}<form id="${prefix}test-form">${body}</form></div>
    </div></section>`;
}

function discoverHtml(d) {
  return `<section id="screen-1" class="step">
    ${introHtml(d.heading, d)}
    <div class="layout">${panelHtml(d)}
      <div class="activity">
        <form id="discover-form">
          <label>Your observations <textarea name="discover_response" placeholder="${esc(d.placeholder)}"></textarea></label>
          <button class="btn" type="submit">Save observations</button>
        </form>
        <div class="lesson" id="worked-example" hidden><h2>${d.lessonTitle}</h2>${d.lesson}</div>
        <div class="nav" id="continue-to-practice" hidden>
          <button class="btn" type="button" data-next="2">Continue to ${practice.name} →</button>
        </div>
      </div>
    </div></section>`;
}

function practiceHtml(p) {
  const fields = p.items.map((item, i) => `
    <label>${esc(item.label)}
      <input name="${P}_${i + 1}" ${inputAttrs}>
      <span class="feedback" id="feedback-${i + 1}" aria-live="polite"></span>
    </label>`).join("");

  const hints = p.hints.map((hint, i) => `
    <details class="hint" data-hint="${i + 1}"><summary>Hint ${i + 1}</summary><p>${hint}</p></details>`).join("");

  return `<section id="screen-2" class="step">
    ${introHtml(`${p.heading}${durationHtml(TIME.practice)}`, p)}
    <div class="layout">${panelHtml(p)}
      <div class="activity">
        ${charBarHtml(p.chars)}

        <form id="fill-form">
          <div class="fields">${fields}</div>
          <button class="btn" type="submit">Submit answers</button>
        </form>

        <div class="lesson" id="rule-section" hidden>
          <h2>${p.ruleTitle}</h2>
          <form id="rule-form">
            <label>Your rule <textarea id="rule-input" name="${P}_rule" placeholder="${esc(p.rulePlaceholder)}"></textarea></label>
            <button class="btn" type="submit">Save rule</button>
            <p id="rule-save-status" class="note" aria-live="polite" hidden></p>
          </form>
        </div>

        <div class="helper" id="hint-panel" hidden>

          <div id="ai-chat-panel" hidden>
            <h2>Discuss and improve your rule with the tutor</h2>
            <div class="chat">
              <div id="chat-messages" class="chat-log" role="log" aria-live="polite" aria-label="Conversation with the tutor">
                <div class="chat-message assistant"><span class="sr-only">Tutor: </span>${formatMessage(p.greeting)}</div>
              </div>
              <form id="chat-form" class="chat-form">
                <textarea id="chat-input" rows="1" maxlength="1000" placeholder="Message" aria-label="Message to the tutor (Enter to send, Shift+Enter for a new line)"></textarea>
                <button id="chat-send-button" class="chat-send" type="submit" aria-label="Send">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
            </div>
            <p id="chat-status" class="chat-status" aria-live="polite" hidden></p>
          </div>

          <div id="static-hints-panel" hidden>
            <h2>Use hints to improve your rule</h2>
            ${hints}
          </div>

          <p class="note">
            You can revise your rule in the text field above and click “Save revised rule” to record each new version.
          </p>
          <div class="nav"><button id="finish-button" class="btn" type="button">Finish this activity</button></div>
        </div>

        <div class="lesson" id="practice-solution" hidden>
          <h2>The rule</h2>
          ${p.solution || ""}
        </div>

        <p id="practice-done" class="note" hidden>The activity is complete. You can now continue to the post-test.</p>
        <div class="nav" id="practice-continue" hidden>
          <button class="btn" type="button" data-next="3">Continue to post-test →</button>
        </div>
      </div>
    </div></section>`;
}

// Only the last unit (no `next`) offers the download, which bundles every unit into one file.
// Questionnaire before the Unit 1 pre-test (content in INTAKE, units.js).
function intakeHtml() {
  const option = (type, name, value, text = value, required = false) =>
    `<label class="option"><input type="${type}" name="${name}" value="${esc(value)}"${required ? " required" : ""}> ${esc(text)}</label>`;

  return `<section id="screen-intake" class="step">
    <div class="intro"><h1>${INTAKE.heading}</h1><p class="source">${INTAKE.intro}</p></div>
    <form id="intake-form" class="intake">
      <label>Email
        <input type="email" name="email" required autocomplete="email" placeholder="name@example.com">
      </label>

      <label>Which languages do you speak, and how well?
        <span class="hint-text">One per line, for example “French – native, English – fluent, Spanish – basic”.</span>
        <textarea name="languages_spoken" required></textarea>
      </label>

      <fieldset>
        <legend>Have you ever taken a linguistics course or taken part in a Linguistics Olympiad?</legend>
        <div class="options">${["Yes", "No"].map((o) => option("radio", "linguistics_background", o, o, true)).join("")}</div>
      </fieldset>

      <fieldset id="known-languages">
        <legend>Do you know any of these languages, even a little?</legend>
        <div class="options">${[...INTAKE.knownLanguages, "None of these"].map((o) => option("checkbox", "known_languages", o)).join("")}</div>
        <p id="known-error" class="field-error" hidden>Please tick at least one option.</p>
      </fieldset>

      <fieldset>
        <legend>How confident are you at learning grammar?</legend>
        <div class="scale">
          <span class="end">Not at all confident</span>
          ${[1, 2, 3, 4, 5].map((n) => option("radio", "grammar_confidence", String(n), String(n), true)).join("")}
          <span class="end">Very confident</span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Consent</legend>
        <p class="consent-text">${INTAKE.consent}</p>
        ${option("checkbox", "consent", "yes", "I have read the above and agree to take part.", true)}
      </fieldset>

      <button class="btn" type="submit">Start Unit 1 →</button>
    </form>
  </section>`;
}

const completeHtml = () => `
  <section id="screen-4" class="step">
    <div class="complete">
      <h1>Unit ${unitNumber} complete. ${unit.next ? "Well done!" : "Thank you for taking part."}</h1>
      ${unit.next
        ? `<p>Your responses have been saved in this browser. Please continue to Unit ${unit.next} in this same browser.</p>
           <button id="next-unit-button" class="btn" type="button">Continue to Unit ${unit.next}</button>`
        : `<p id="complete-status" aria-live="polite">Grading your answers, this takes a few seconds…</p>
           <div id="results" hidden></div>
           <button id="download-data" class="btn" type="button" disabled>Download my responses (JSON)</button>
           <a class="btn" href="index.html">Back to home</a>`}
    </div>
  </section>`;


/* ---------- Screens ---------- */

function showScreen(n) {
  document.querySelectorAll(".step").forEach((el) => el.classList.toggle("active", el.id === `screen-${n}`));
  lastField = null;

  if (n === "intake") {
    $("progress-label").textContent = "Before you start";
    $("progress-fill").style.width = "0%";
  } else {
    $("progress-label").textContent = n < 4 ? `Step ${n + 1} of 4 · ${STEP_NAMES[n]}` : "Complete";
    $("progress-fill").style.width = (n < 4 ? (n + 1) * 25 : 100) + "%";
  }

  log("screen_opened", { screen: n });
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (n === 1) log(unit.discover.event);

  if (n === 2 && stage === "not_started") {
    stage = "pattern";
    log(`${P}_activity_opened`);
    log(`${P}_pattern_stage_started`);
  }
  if (n === 4) {
    data.completed_at = new Date().toISOString();
    save();
    if (!unit.next) finishExperiment();
  }
}


/* ---------- Questionnaire ---------- */

function initIntake() {
  const form = $("intake-form");
  const boxes = () => form.querySelectorAll('input[name="known_languages"]');

  // "None of these" and the languages exclude each other
  form.addEventListener("change", (event) => {
    if (event.target.name !== "known_languages" || !event.target.checked) return;
    const none = event.target.value === "None of these";
    boxes().forEach((box) => {
      if (box !== event.target && (none || box.value === "None of these")) box.checked = false;
    });
    $("known-error").hidden = true;
  });

  // The browser checks the required fields before this runs
  onSubmit("intake-form", () => {
    const answers = new FormData(form);
    const known = answers.getAll("known_languages");
    if (!known.length) {
      $("known-error").hidden = false;
      $("known-languages").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    data.intake = {
      email: String(answers.get("email")).trim().toLowerCase(),
      languages_spoken: String(answers.get("languages_spoken")).trim(),
      linguistics_background: answers.get("linguistics_background"),
      known_languages: known,
      grammar_confidence: Number(answers.get("grammar_confidence")),
      consent: true,
      submitted_at: new Date().toISOString()
    };
    log("intake_submitted");
    showScreen(0);
  });
}


/* ---------- Pre-test, discover, post-test ---------- */

function initTests() {
  [["pre", preTest], ["post", postTest]].forEach(([prefix, test]) => {
    onSubmit(`${prefix}test-form`, (form) => {
      const answers = answersOf(form);
      const score = gradeTest(test, prefix, answers);
      data.responses[`${prefix}test`] = answers;
      data.scores[`${prefix}test`] = score;
      log(`${prefix}test_submitted`, {
        score: score.total,
        maximum: score.maximum,
        rule_response: answers[`${prefix}_rule`] || ""
      });
      grading[prefix] = gradeAndStore(unitNumber, data, test, prefix);   // runs in the background
      showScreen(prefix === "pre" ? 1 : 4);
    });
  });

  onSubmit("discover-form", (form) => {
    const answers = answersOf(form);
    data.responses.discover = answers;
    log("discover_response_saved", { response: answers.discover_response || "" });
    lock(form, "Observations saved");
    $("worked-example").hidden = false;
    $("continue-to-practice").hidden = false;
  });

  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      $(button.dataset.reveal).hidden = false;
      button.hidden = true;
    });
  });

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => showScreen(Number(button.dataset.next)));
  });
}


/* ---------- Practice activity (fill in → rule → hints or tutor) ---------- */

function initPractice() {
  // Stage 1 — fill in the missing forms
  onSubmit("fill-form", (form) => {
    if (stage !== "pattern") return;

    const answers = answersOf(form);
    const correct = practice.items.map((item, i) =>
      isCorrect(answers[`${P}_${i + 1}`], item.key, practice.strict));
    data.responses[P] = answers;
    data.scores[P] = { correct, total: correct.filter(Boolean).length, maximum: correct.length };

    correct.forEach((ok, i) => {
      const feedback = $(`feedback-${i + 1}`);
      // The right answers are only revealed at the end of the activity (see finishPractice).
      feedback.textContent = ok ? "Correct!" : "Incorrect.";
      feedback.className = "feedback " + (ok ? "correct" : "incorrect");
    });

    log(`${P}_answers_submitted`, {
      score: data.scores[P].total,
      maximum: correct.length,
      unanswered: Object.values(answers).filter((a) => a === "").length
    });

    lock(form, "Answers submitted");
    stage = "rule";
    $("rule-section").hidden = false;
    log(`${P}_rule_stage_started`);
  });

  // Stage 2 — write (and later revise) the rule
  onSubmit("rule-form", () => {
    if (stage !== "rule" && stage !== "correction") return;

    saveRule($("rule-input").value.trim());

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

  $("finish-button").addEventListener("click", finishPractice);
}

function saveRule(text) {
  const r = data.responses;
  const now = new Date().toISOString();

  if (!(`${P}_rule_initial` in r)) {
    r[`${P}_rule_initial`] = text;
    r[`${P}_rule_initial_timestamp`] = now;
    log(`${P}_initial_rule_submitted`, { rule: text, timestamp: now });
  } else {
    const revisions = (r[`${P}_rule_revisions`] ??= []);
    const previous = revisions.at(-1)?.text ?? r[`${P}_rule_initial`];

    if (text === previous) {
      log(`${P}_rule_resubmitted_without_change`);
    } else {
      revisions.push({ text, timestamp: now });
      log(`${P}_rule_revised`, { rule: text, revision_number: revisions.length, timestamp: now });
    }
  }

  const history = (r[`${P}_rule_history`] ??= []);
  const last = history.at(-1);
  if (!last || last.text !== text || last.stage !== stage) history.push({ text, stage, timestamp: now });

  r[`${P}_rule`] = text;
  r[`${P}_rule_latest_timestamp`] = now;
  save();
}

function startCorrection() {
  stage = "correction";
  log(`${P}_correction_stage_started`);

  $("hint-panel").hidden = false;
  $("ai-chat-panel").hidden = mode !== "ai";
  $("static-hints-panel").hidden = mode === "ai";

  if (mode === "ai") {
    chat = [];
    data.responses[`${P}_chat`] = [];
    save();
  }
}

function finishPractice() {
  if (stage === "complete") return;
  stage = "complete";
  log(`${P}_activity_completed`);

  data.responses[`${P}_rule_latest_unsubmitted`] = $("rule-input").value.trim();
  save();

  $("chat-input").disabled = true;
  $("chat-input").placeholder = "Activity finished";
  $("chat-send-button").disabled = true;

  const finish = $("finish-button");
  finish.disabled = true;
  finish.textContent = "Activity finished";

  // Reveal the right answer next to each wrong blank, then the full rule.
  (data.scores[P]?.correct || []).forEach((ok, i) => {
    if (!ok) $(`feedback-${i + 1}`).textContent = `Incorrect. The answer is ${[].concat(practice.items[i].key)[0]}.`;
  });
  if (practice.solution) $("practice-solution").hidden = false;
  log(`${P}_solution_shown`);
  $("practice-done").hidden = false;
  $("practice-continue").hidden = false;
}


/* ---------- AI tutor ---------- */

// Tutor replies use light Markdown: **bold**, *italic* / _italic_, line breaks. Everything else stays plain text.
function formatMessage(text) {
  return esc(String(text).trim())
    .split(/\n\s*\n/)
    .map((paragraph) => "<p>" + paragraph
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
      .replace(/\n/g, "<br>") + "</p>")
    .join("");
}

// The message box grows with its text, up to a few lines.
function fitInput(input) {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight + 2, 140) + "px";
}

function initChat() {
  const input = $("chat-input");

  // Enter sends, Shift+Enter inserts a new line
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      $("chat-form").requestSubmit();
    }
  });
  input.addEventListener("input", () => fitInput(input));

  onSubmit("chat-form", async () => {
    const text = input.value.trim();
    if (mode !== "ai" || stage !== "correction" || chatBusy || !text) return;

    chat.push({ role: "user", content: text, timestamp: new Date().toISOString() });
    addBubble("user", text);
    input.value = "";
    fitInput(input);
    data.responses[`${P}_chat`] = chat;
    log("chat_message_sent", { message_number: chat.length });

    await requestReply();
  });
}

function addBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = "chat-message " + role;
  const who = `<span class="sr-only">${role === "user" ? "You" : "Tutor"}: </span>`;
  // Participant messages are shown exactly as typed; tutor replies get light formatting.
  bubble.innerHTML = who + (role === "user" ? `<p>${esc(text).replace(/\n/g, "<br>")}</p>` : formatMessage(text));

  const box = $("chat-messages");
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function setChatBusy(busy, error = "") {
  chatBusy = busy;
  const enabled = !busy && stage === "correction";
  $("chat-input").disabled = !enabled;
  $("chat-send-button").disabled = !enabled;
  if (enabled) $("chat-input").focus();

  // "Typing" dots while the tutor is answering
  $("chat-typing")?.remove();
  if (busy) {
    const box = $("chat-messages");
    box.insertAdjacentHTML("beforeend",
      `<div id="chat-typing" class="chat-message assistant typing"><span class="sr-only">The tutor is typing</span><i></i><i></i><i></i></div>`);
    box.scrollTop = box.scrollHeight;
  }

  const status = $("chat-status");
  status.textContent = error;
  status.hidden = !error;
}

async function requestReply() {
  setChatBusy(true);

  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chat.map(({ role, content }) => ({ role, content })),
        currentRule: $("rule-input").value.trim(),
        participantId,
        unit: unitNumber,
        activity: P
      })
    });

    const reply = await response.json();
    if (!response.ok) throw new Error(reply.error || "The chatbot could not respond.");
    if (!reply.reply) throw new Error("The chatbot returned an empty response.");

    chat.push({ role: "assistant", content: reply.reply, timestamp: new Date().toISOString() });
    addBubble("assistant", reply.reply);
    data.responses[`${P}_chat`] = chat;
    log("chat_reply_received", { message_number: chat.length });
    setChatBusy(false);

  } catch (error) {
    console.error("Chatbot error:", error);
    log("chat_request_failed", { error: String(error.message || error) });
    setChatBusy(false, "Sorry, the tutor could not respond. Please try again.");
  }
}


/* ---------- Special-character bar ---------- */

function initCharBar() {
  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input, textarea")) lastField = event.target;
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-char]");
    if (!button || !lastField || lastField.disabled) return;

    const char = button.dataset.char;
    const { selectionStart: start, selectionEnd: end, value } = lastField;
    lastField.value = value.slice(0, start) + char + value.slice(end);
    lastField.focus();
    lastField.setSelectionRange(start + char.length, start + char.length);
  });
}


/* ---------- AI grading of the pre-test and post-test ----------
   Closed questions: 1 correct · 0.5 minor spelling slip · 0 wrong.
   Exact answer-key matches always get 1; other answers are judged by the AI.
   The rule is graded 0–5. */

function findTest(n, name) {
  const u = UNITS[n];
  return [u.pre, u.post].find((t) => t && t.name === name);
}

async function gradeWithAI(unitData, test, prefix) {
  const answers = unitData.responses[`${prefix}test`];

  const written = ["apply", "transfer"].flatMap((part) => (test[part]?.items || []).map((item, i) => {
    const id = `${prefix}_${part}_${i + 1}`;
    const answer = answers[id] || "";
    return { id, part, prompt: item.label, accepted: [].concat(item.key), answer,
             exact: isCorrect(answer, item.key, test.strict) };
  }));

  const response = await fetch(GRADE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      language: test.name,
      notes: [test.letters, test.apply?.note, test.transfer?.note].filter(Boolean),
      examples: test.examples.map(([word, meaning]) => `${[].concat(word).join(" · ")} = ${meaning}`),
      items: written,
      rule: {
        question: test.rule.title,
        reference: test.rule.answer,
        patterns: test.rule.patterns || [],
        answer: answers[`${prefix}_rule`] || ""
      }
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The grader could not respond.");

  const graded = new Map(result.items.map((g) => [g.id, g]));
  const items = written.map(({ exact, ...item }) => {
    const g = graded.get(item.id) || { points: 0, reason: "Not graded.", graded_by: "none" };
    return { ...item, points: g.points, reason: g.reason, graded_by: g.graded_by };
  });
  const sum = (list) => list.reduce((total, item) => total + item.points, 0);

  return {
    test: test.name,
    closed: { total: sum(items), maximum: items.length, items },
    rule: { answer: answers[`${prefix}_rule`] || "", score: result.rule.score, maximum: 5, feedback: result.rule.feedback },
    model: result.model,
    graded_at: new Date().toISOString()
  };
}

// Never throws: a failure is stored as { error } so it can be retried at the end.
async function gradeAndStore(n, unitData, test, prefix) {
  const key = `${prefix}test`;
  unitData.ai_scores ??= {};
  try {
    unitData.ai_scores[key] = await gradeWithAI(unitData, test, prefix);
  } catch (error) {
    console.error(`AI grading of Unit ${n} ${key} failed:`, error);
    unitData.ai_scores[key] = { test: test.name, error: String(error.message || error), failed_at: new Date().toISOString() };
  }
  saveUnit(n, unitData);
  if (n === unitNumber) log(`${key}_ai_graded`, { ok: !unitData.ai_scores[key].error });
}

// Grades every submitted test (all units) that has no AI score yet or whose grading failed.
async function gradeMissing(units) {
  await Promise.all(Object.values(grading));
  await Promise.all(Object.entries(units).flatMap(([n, unitData]) => ["pre", "post"].map((prefix) => {
    const key = `${prefix}test`;
    const score = unitData.ai_scores?.[key];
    if (!unitData.responses?.[key] || (score && !score.error)) return null;
    const test = findTest(n, unitData[`${prefix}_test`]);
    return test ? gradeAndStore(Number(n), unitData, test, prefix) : null;
  })));
}


/* ---------- Results, download & next unit ---------- */

// Loads every unit's saved data for this participant (the current unit uses the live `data`).
function loadUnits() {
  const units = {};
  const missing = [];
  Object.keys(UNITS).forEach((n) => {
    if (Number(n) === unitNumber) { units[n] = data; return; }
    try {
      const saved = localStorage.getItem(`rosetta_unit${n}_${participantId}`);
      if (saved) units[n] = JSON.parse(saved);
      else missing.push(Number(n));
    } catch (error) {
      console.error(`Could not read Unit ${n} data:`, error);
      missing.push(Number(n));
    }
  });
  return { units, missing };
}

let allUnits = null;

// One row per unit and test, used for the results screen and the file's summary.
function scoreSummary(units) {
  return Object.entries(units).flatMap(([n, unitData]) => ["pre", "post"].map((prefix) => {
    const s = unitData.ai_scores?.[`${prefix}test`];
    return {
      unit: Number(n),
      phase: `${prefix}test`,
      test: unitData[`${prefix}_test`],
      closed_score: s && !s.error ? s.closed.total : null,
      closed_maximum: s && !s.error ? s.closed.maximum : null,
      rule_score: s && !s.error ? s.rule.score : null,
      rule_maximum: 5,
      ...(s?.error && { error: s.error })
    };
  }));
}

function combinedData() {
  const { units, missing } = allUnits || loadUnits();
  return {
    participant_id: participantId,
    participant_number: participantNumber,
    experiment_mode: mode,
    exported_at: data.exported_at,
    missing_units: missing,
    intake: units[1]?.intake ?? null,               // the questionnaire (asked in Unit 1)
    ai_score_summary: scoreSummary(units),
    units
  };
}

function resultsHtml(units) {
  const fmt = (x) => Number.isInteger(x) ? String(x) : `${Math.floor(x) || ""}½`;
  const rows = scoreSummary(units).map((r) => {
    const s = units[r.unit].ai_scores?.[r.phase];
    const label = `Unit ${r.unit} · ${r.phase === "pretest" ? "Pre-test" : "Post-test"} · ${esc(r.test)}`;
    if (!s || s.error) {
      return `<tr><th scope="row">${label}</th><td colspan="2" class="muted">Could not be graded</td></tr>`;
    }
    const items = s.closed.items.map((item) =>
      `<li><span>${esc(item.prompt)}: <strong>${esc(item.answer || "—")}</strong></span>
           <span class="points">${fmt(item.points)} / 1</span></li>`).join("");
    return `<tr><th scope="row">${label}</th>
        <td>${fmt(r.closed_score)} / ${r.closed_maximum}</td>
        <td>${r.rule_score} / 5</td></tr>
      <tr class="detail"><td colspan="3"><details><summary>Details</summary>
        <ul class="item-scores">${items}</ul>
        <p><strong>Your rule:</strong> ${esc(s.rule.answer || "—")}</p>
        <p><strong>Feedback:</strong> ${esc(s.rule.feedback)}</p>
      </details></td></tr>`;
  }).join("");

  return `<div class="table-wrap"><table class="results">
    <thead><tr><th scope="col">Test</th><th scope="col">Questions</th><th scope="col">Rule</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// Final unit: make sure everything is graded, show the results, then download one file.
async function finishExperiment() {
  allUnits = loadUnits();
  await gradeMissing(allUnits.units);

  $("results").innerHTML = resultsHtml(allUnits.units);
  $("results").hidden = false;
  $("complete-status").textContent = allUnits.missing.length
    ? `Your responses have been downloaded as a single file. Note: no saved data was found for Unit ${allUnits.missing.join(", ")} in this browser.`
    : "Your responses for all units have been downloaded as a single file. If the download did not start, use the button below.";
  $("download-data").disabled = false;
  downloadResponses();
}

function downloadResponses() {
  data.exported_at = new Date().toISOString();
  save();

  const url = URL.createObjectURL(new Blob([JSON.stringify(combinedData(), null, 2)], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: `rosetta_${participantId}.json`
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  log("responses_downloaded");
}


/* ---------- Start ---------- */

document.title = `Rosetta — Unit ${unitNumber}`;
document.body.dataset.experimentMode = mode;
$("unit-label").textContent = unit.label;

const hasIntake = unitNumber === 1;               // questionnaire once, before the first pre-test

$("screens").innerHTML = [
  hasIntake ? intakeHtml() : "",
  testScreenHtml(preTest, "pre", 0),
  discoverHtml(unit.discover),
  practiceHtml(practice),
  testScreenHtml(postTest, "post", 3),
  completeHtml()
].join("");

if (!unit.next) {
  $("download-data").addEventListener("click", downloadResponses);
} else {
  $("next-unit-button").addEventListener("click", async (event) => {
    log(`unit_${unit.next}_requested`);
    // Let the post-test grading finish first (anything missed is regraded at the end of the last unit).
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = "Saving your responses…";
    await Promise.all(Object.values(grading));
    // Participants keep ?p= (the condition stays hidden); testing runs keep ?mode=.
    const who = participantNumber ? `p=${participantNumber}` : `mode=${mode}`;
    location.href = `experiment.html?${who}&unit=${unit.next}&pid=${encodeURIComponent(participantId)}`;
  });
}

log("experiment_started", { mode });
if (hasIntake) initIntake();
initTests();
initPractice();
initChat();
initCharBar();
showScreen(hasIntake ? "intake" : 0);
