
/* =========================================================
   ROSETTA EXPERIMENT — UNIT 1
   Main JavaScript
   ========================================================= */


/* =========================================================
   EXPERIMENT STATE
   ========================================================= */

let experimentMode = "ai";
let currentScreen = 0;

let participantId = null;
let experimentData = {};


// Pre/post-test timers
let preTimerInterval = null;
let postTimerInterval = null;

let preTimeRemaining = 60;
let postTimeRemaining = 60;


// Swahili activity timers
let patternTimerInterval = null;
let ruleTimerInterval = null;
let correctionTimerInterval = null;

const PRETEST_DURATION = 60;
const POSTTEST_DURATION = 60;

const PATTERN_DURATION = 60;
const RULE_DURATION = 60;
const CORRECTION_DURATION = 60;

let patternTimeRemaining = PATTERN_DURATION;
let ruleTimeRemaining = RULE_DURATION;
let correctionTimeRemaining = CORRECTION_DURATION;


// Swahili activity stage
let swahiliStage = "not_started";

// Replace this with your Vercel deployment URL after deployment.
const CHAT_API_URL =
    "https://rosetta-linguistics.vercel.app/api/chat";

let chatMessages = [];
let chatRequestInProgress = false;

// Hint state
let hintOpened = [false, false, false];
let hintUnlocked = [false, false, false];

const HINT_UNLOCK_TIMES = [
    0,
    20,
    40
];




/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);

    experimentMode =
        params.get("mode") === "non-ai" ? "non-ai" : "ai";

    participantId = getOrCreateParticipantId();

    document.body.dataset.experimentMode = experimentMode;

    experimentData = {

        participant_id: participantId,

        experiment_mode: experimentMode,

        unit: 1,

        started_at: new Date().toISOString(),

        completed_at: null,

        responses: {},

        events: [],

        scores: {}

    };


    recordEvent("experiment_started", {
        mode: experimentMode
    });


    initialiseNavigation();

    initialiseForms();

    initialiseHints();
    initialiseChat();

    initialiseDownload();

    initialiseHintAvailability();


    showScreen(0);

    startAssessmentTimer("pre-timer", PRETEST_DURATION, "pre");

});


/* =========================================================
   PARTICIPANT ID
   ========================================================= */

function getOrCreateParticipantId() {

    let id = localStorage.getItem("rosetta_participant_id");

    if (!id) {

        id =
            "P-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random().toString(36).substring(2, 8).toUpperCase();

        localStorage.setItem("rosetta_participant_id", id);

    }

    return id;

}


/* =========================================================
   EVENT LOGGING
   ========================================================= */

function recordEvent(eventName, details = {}) {

    if (!experimentData.events) {

        experimentData.events = [];

    }

    experimentData.events.push({

        event: eventName,

        timestamp: new Date().toISOString(),

        details: details

    });

    saveDataLocally();

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function saveDataLocally() {

    try {

        localStorage.setItem(

            "rosetta_unit1_" + participantId,

            JSON.stringify(experimentData)

        );

    } catch (error) {

        console.error(
            "Could not save experiment data:",
            error
        );

    }

}


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function initialiseNavigation() {

    document.querySelectorAll("[data-next]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            const nextScreen = Number(button.dataset.next);


            // Swahili activity must finish before continuing.
            if (
                currentScreen === 2 &&
                swahiliStage !== "complete"
            ) {

                event.preventDefault();

                alert(
                    "Please complete the Swahili activity before continuing."
                );

                return;

            }


            showScreen(nextScreen);

        });

    });


    const unit2Button = document.getElementById("unit-2-button");

    if (unit2Button) {

        unit2Button.addEventListener("click", function () {

            recordEvent("unit_2_requested");

            alert(
                "Unit 2 is not available yet. Thank you for completing Unit 1!"
            );

        });

    }

}


function showScreen(screenNumber) {


    // Do not leave the Swahili activity early.
    if (
        currentScreen === 2 &&
        screenNumber !== 2 &&
        swahiliStage !== "complete"
    ) {

        return;

    }


    // Do not leave the post-test early.
    if (
        currentScreen === 3 &&
        screenNumber !== 3 &&
        postTimeRemaining > 0
    ) {

        return;

    }


    const target = document.getElementById(
        "screen-" + screenNumber
    );

    if (!target) {
        return;
    }


    document.querySelectorAll(".experiment-step").forEach(function (screen) {

        screen.classList.remove("active");

    });


    target.classList.add("active");

    currentScreen = screenNumber;


    const stepNumber = document.getElementById("step-number");

    if (stepNumber) {

        stepNumber.textContent = screenNumber;

    }


    recordEvent("screen_opened", {

        screen: screenNumber

    });


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    if (screenNumber === 1) {

        recordEvent("zulu_discovery_and_worked_example_opened");

    }


    if (screenNumber === 2) {

        recordEvent("swahili_activity_opened");

        if (swahiliStage === "not_started") {

            startPatternStage();

        }

    }


    if (screenNumber === 3) {

        if (!postTimerInterval && postTimeRemaining > 0) {

            startAssessmentTimer(
                "post-timer",
                postTimeRemaining,
                "post"
            );

        }

    }


    if (screenNumber === 4) {

        experimentData.completed_at = new Date().toISOString();

        saveDataLocally();

    }

}


/* =========================================================
   FORM INITIALISATION
   ========================================================= */

function initialiseForms() {


    /* -----------------------------------------------------
       PRE-TEST
       ----------------------------------------------------- */

    const pretestForm = document.getElementById("pretest-form");

    if (pretestForm) {

        pretestForm.addEventListener("submit", function (event) {

            event.preventDefault();


            // Participants may now submit before the timer ends.
            const answers = getFormAnswers(pretestForm);

            experimentData.responses.pretest = answers;

            experimentData.scores.pretest = gradePretest(answers);

            recordEvent("pretest_submitted", {

                score: experimentData.scores.pretest.total,

                maximum: experimentData.scores.pretest.maximum,

                rule_response: answers.pre_rule || ""

            });

            stopAssessmentTimer("pre");

            saveDataLocally();

            showScreen(1);

        });

    }


    /* -----------------------------------------------------
       ZULU DISCOVERY
       ----------------------------------------------------- */

    const discoverForm = document.getElementById("discover-form");

    if (discoverForm) {

        discoverForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answers = getFormAnswers(discoverForm);

            experimentData.responses.discover = answers;

            recordEvent("discover_response_saved");

            saveDataLocally();


            // Disable the form after submission.
            const button = discoverForm.querySelector(
                "button[type='submit']"
            );

            if (button) {

                button.disabled = true;

                button.textContent = "Observations saved";

            }


            discoverForm.querySelectorAll("textarea").forEach(function (input) {

                input.disabled = true;

            });

        });

    }


    /* -----------------------------------------------------
       SWAHILI PATTERN MATCHING
       ----------------------------------------------------- */

    const swahiliForm = document.getElementById("swahili-form");

    if (swahiliForm) {

        swahiliForm.addEventListener("submit", function (event) {

            event.preventDefault();

            submitSwahiliPattern();

        });

    }


    /* -----------------------------------------------------
       SWAHILI RULE WRITING AND REVISIONS
       ----------------------------------------------------- */

    const ruleForm = document.getElementById("rule-form");

    if (ruleForm) {

        const ruleInput = document.getElementById("swahili-rule");


        ruleForm.addEventListener("submit", function (event) {

            event.preventDefault();

            if (
                swahiliStage !== "rule" &&
                swahiliStage !== "correction"
            ) {

                return;

            }


            const answer = ruleInput.value.trim();

            if (!answer) {

                alert("Please write your rule before submitting.");

                return;

            }


            saveSubmittedRule(answer);

        });

    }


    /* -----------------------------------------------------
       POST-TEST
       ----------------------------------------------------- */

    const posttestForm = document.getElementById("posttest-form");

    if (posttestForm) {

        posttestForm.addEventListener("submit", function (event) {

            event.preventDefault();

            if (postTimeRemaining > 0) {

                alert(
                    "You cannot submit the post-test before the timer reaches 00:00."
                );

                return;

            }

            const answers = getFormAnswers(posttestForm);

            experimentData.responses.posttest = answers;

            experimentData.scores.posttest = gradePosttest(answers);

            recordEvent("posttest_submitted", {

                score: experimentData.scores.posttest.total,

                maximum: experimentData.scores.posttest.maximum,

                rule_response: answers.post_rule || ""

            });

            stopAssessmentTimer("post");

            experimentData.completed_at = new Date().toISOString();

            saveDataLocally();

            showScreen(4);

        });

    }

}


/* =========================================================
   GET FORM ANSWERS
   ========================================================= */

function getFormAnswers(form) {

    const answers = {};

    const formData = new FormData(form);

    formData.forEach(function (value, key) {

        answers[key] = String(value).trim();

    });

    return answers;

}


/* =========================================================
   ANSWER NORMALISATION
   ========================================================= */

function normalise(text) {

    return String(text || "")

        .toLowerCase()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .replace(/[.,!?;:]/g, "")

        .replace(/\s+/g, " ")

        .trim();

}


function answerMatches(answer, acceptedAnswers) {

    const cleaned = normalise(answer);

    return acceptedAnswers.some(function (accepted) {

        return cleaned === normalise(accepted);

    });

}


/* =========================================================
   PRE-TEST GRADING
   Apply + Transfer only.
   Rule formulation is saved separately and not scored.
   Maximum score: 5.
   ========================================================= */

function gradePretest(a) {

    const applyKeys = [

        ["nichakukadha"],

        ["bhichakundana"],

        ["mucharashana"]

    ];

    let applyScore = 0;

    for (let i = 1; i <= 3; i++) {

        if (
            answerMatches(
                a["pre_apply_" + i],
                applyKeys[i - 1]
            )
        ) {

            applyScore++;

        }

    }


    const transferKeys = [

        ["kuchabhirasha"],

        ["dichamukunda"]

    ];

    let transferScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (
            answerMatches(
                a["pre_transfer_" + i],
                transferKeys[i - 1]
            )
        ) {

            transferScore++;

        }

    }


    return {

        apply_score: applyScore,

        apply_maximum: 3,

        transfer_score: transferScore,

        transfer_maximum: 2,

        total: applyScore + transferScore,

        maximum: 5

    };

}


/* =========================================================
   SWAHILI GRADING
   ========================================================= */

function gradeSwahili(a) {

    const keys = [

        ["aliwaona"],

        ["nitakawuona"],

        ["aliniona"]

    ];

    const correct = [];

    for (let i = 1; i <= 3; i++) {

        correct.push(

            answerMatches(
                a["swahili_" + i],
                keys[i - 1]
            )

        );

    }


    return {

        correct: correct,

        total: correct.filter(Boolean).length,

        maximum: 3

    };

}


function displaySwahiliFeedback(results) {

    for (let i = 1; i <= 3; i++) {

        const feedback = document.getElementById(
            "swahili-feedback-" + i
        );

        if (!feedback) {
            continue;
        }


        if (results.correct[i - 1]) {

            feedback.textContent = "Correct!";

            feedback.className = "feedback correct";

        } else {

            feedback.textContent = "Incorrect.";

            feedback.className = "feedback incorrect";

        }

    }

}


/* =========================================================
   POST-TEST GRADING
   Apply + Transfer only.
   Rule formulation is saved separately and not scored.
   Maximum score: 5.
   ========================================================= */

function gradePosttest(a) {

    const applyKeys = [

        ["ābola", "abola"],

        ["bērna", "berna"],

        ["galda"]

    ];

    let applyScore = 0;

    for (let i = 1; i <= 3; i++) {

        if (
            answerMatches(
                a["post_apply_" + i],
                applyKeys[i - 1]
            )
        ) {

            applyScore++;

        }

    }


    const transferKeys = [

        ["autora"],

        ["institūtu", "institutu"]

    ];

    let transferScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (
            answerMatches(
                a["post_transfer_" + i],
                transferKeys[i - 1]
            )
        ) {

            transferScore++;

        }

    }


    return {

        apply_score: applyScore,

        apply_maximum: 3,

        transfer_score: transferScore,

        transfer_maximum: 2,

        total: applyScore + transferScore,

        maximum: 5

    };

}


/* =========================================================
   ASSESSMENT COUNTDOWN TIMERS
   Pre-test and post-test
   ========================================================= */

function startAssessmentTimer(elementId, seconds, timerType) {

    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }


    if (timerType === "pre" && preTimerInterval) {
        return;
    }

    if (timerType === "post" && postTimerInterval) {
        return;
    }


    function updateDisplay() {

        const minutes = Math.floor(seconds / 60);

        const remainingSeconds = seconds % 60;

        element.textContent =

            String(minutes).padStart(2, "0") +

            ":" +

            String(remainingSeconds).padStart(2, "0");

    }


    updateDisplay();


    const interval = setInterval(function () {

        seconds--;


        if (timerType === "pre") {

            preTimeRemaining = Math.max(0, seconds);

        } else if (timerType === "post") {

            postTimeRemaining = Math.max(0, seconds);

        }


        updateDisplay();


        if (seconds <= 0) {

            clearInterval(interval);


            if (timerType === "pre") {

                preTimerInterval = null;

                autoSubmitAssessment("pretest-form", 1);

            }


            if (timerType === "post") {

                postTimerInterval = null;

                autoSubmitAssessment("posttest-form", 4);

            }

        }

    }, 1000);


    if (timerType === "pre") {

        preTimerInterval = interval;

    } else {

        postTimerInterval = interval;

    }

}


function stopAssessmentTimer(timerType) {

    if (timerType === "pre" && preTimerInterval) {

        clearInterval(preTimerInterval);

        preTimerInterval = null;

    }


    if (timerType === "post" && postTimerInterval) {

        clearInterval(postTimerInterval);

        postTimerInterval = null;

    }

}


/* =========================================================
   AUTO-SUBMIT PRE-TEST AND POST-TEST
   ========================================================= */

function autoSubmitAssessment(formId, nextScreen) {

    const form = document.getElementById(formId);

    if (!form) {
        return;
    }


    const answers = getFormAnswers(form);


    if (formId === "pretest-form") {

        experimentData.responses.pretest = answers;

        experimentData.scores.pretest = gradePretest(answers);

        recordEvent("pretest_time_expired", {

            score: experimentData.scores.pretest.total,

            maximum: experimentData.scores.pretest.maximum,

            rule_response: answers.pre_rule || ""

        });

    } else {

        experimentData.responses.posttest = answers;

        experimentData.scores.posttest = gradePosttest(answers);

        experimentData.completed_at = new Date().toISOString();

        recordEvent("posttest_time_expired", {

            score: experimentData.scores.posttest.total,

            maximum: experimentData.scores.posttest.maximum,

            rule_response: answers.post_rule || ""

        });

    }


    saveDataLocally();


    form.querySelectorAll("input, textarea, button").forEach(function (element) {

        element.disabled = true;

    });


    alert("Time is up. Your answers have been saved.");

    showScreen(nextScreen);

}


/* =========================================================
   SWAHILI ACTIVITY — STAGE 1
   PATTERN MATCHING
   ========================================================= */

function startPatternStage() {

    if (swahiliStage !== "not_started") {
        return;
    }


    swahiliStage = "pattern";

    patternTimeRemaining = PATTERN_DURATION;


    recordEvent("swahili_pattern_stage_started");


    updateStageTimerDisplay(
        "pattern-timer",
        patternTimeRemaining
    );


    patternTimerInterval = setInterval(function () {

        patternTimeRemaining--;

        updateStageTimerDisplay(
            "pattern-timer",
            patternTimeRemaining
        );


        if (patternTimeRemaining <= 0) {

            clearInterval(patternTimerInterval);

            patternTimerInterval = null;


            // Automatically submit the answers when time expires.
            submitSwahiliPattern(true);

        }

    }, 1000);

}


/* =========================================================
   SWAHILI PATTERN MATCHING — SUBMISSION
   ========================================================= */

function submitSwahiliPattern(timeExpired = false) {

    if (swahiliStage !== "pattern") {
        return;
    }


    const form = document.getElementById("swahili-form");

    if (!form) {
        return;
    }


    const answers = getFormAnswers(form);

    experimentData.responses.swahili = answers;

    const results = gradeSwahili(answers);

    experimentData.scores.swahili = results;

    displaySwahiliFeedback(results);


    recordEvent("swahili_answers_submitted", {

        score: results.total,

        maximum: results.maximum,

        time_expired: timeExpired

    });


    saveDataLocally();


    // Stop the pattern-matching timer.
    if (patternTimerInterval) {

        clearInterval(patternTimerInterval);

        patternTimerInterval = null;

    }


    patternTimeRemaining = 0;

    updateStageTimerDisplay("pattern-timer", 0);


    // Disable the pattern-matching inputs.
    form.querySelectorAll("input").forEach(function (input) {

        input.disabled = true;

    });


    const button = form.querySelector(
        "button[type='submit']"
    );

    if (button) {

        button.disabled = true;

        button.textContent = "Answers submitted";

    }


    // Reveal the rule-writing stage.
    startRuleWritingStage();

}


/* =========================================================
   SWAHILI ACTIVITY — STAGE 2
   INITIAL RULE WRITING
   ========================================================= */

function startRuleWritingStage() {

    if (swahiliStage !== "pattern") {
        return;
    }


    swahiliStage = "rule";

    ruleTimeRemaining = RULE_DURATION;


    const lesson = document.getElementById("lesson-text");

    if (lesson) {

        lesson.hidden = false;

    }


    recordEvent("swahili_rule_stage_started");


    updateStageTimerDisplay(
        "rule-timer",
        ruleTimeRemaining
    );


    ruleTimerInterval = setInterval(function () {

        ruleTimeRemaining--;

        updateStageTimerDisplay(
            "rule-timer",
            ruleTimeRemaining
        );


        if (ruleTimeRemaining <= 0) {

            clearInterval(ruleTimerInterval);

            ruleTimerInterval = null;


            // Capture the initial rule if the participant
            // has not explicitly submitted one.
            captureInitialRuleIfNeeded();


            // Start the correction stage.
            startCorrectionStage();

        }

    }, 1000);

}


/* =========================================================
   SWAHILI RULE — SAVE SUBMITTED VERSION
   Every submitted version receives a timestamp.
   ========================================================= */

function saveSubmittedRule(answer) {

    const responses = experimentData.responses;

    const timestamp = new Date().toISOString();


    // Use property existence rather than truthiness.
    // This correctly handles an empty initial response.
    const isInitialRule = !Object.prototype.hasOwnProperty.call(
        responses,
        "swahili_rule_initial"
    );


    if (!responses.swahili_rule_history) {

        responses.swahili_rule_history = [];

    }


    if (isInitialRule) {

        responses.swahili_rule_initial = answer;

        responses.swahili_rule_initial_timestamp = timestamp;

        recordEvent("swahili_initial_rule_submitted", {

            rule: answer,

            timestamp: timestamp

        });

    } else {

        if (!responses.swahili_rule_revisions) {

            responses.swahili_rule_revisions = [];

        }


        const revisions = responses.swahili_rule_revisions;

        const previousVersion =
            revisions.length > 0
                ? revisions[revisions.length - 1].text
                : responses.swahili_rule_initial;


        // Only save a revision if the submitted text has changed.
        if (answer !== previousVersion) {

            const revision = {

                text: answer,

                timestamp: timestamp

            };

            revisions.push(revision);


            recordEvent("swahili_rule_revised", {

                rule: answer,

                revision_number: revisions.length,

                timestamp: timestamp

            });

        } else {

            recordEvent("swahili_rule_resubmitted_without_change");

        }

    }


    // Record every explicit submission in chronological order.
    const lastHistoryEntry =
        responses.swahili_rule_history.length > 0
            ? responses.swahili_rule_history[
                responses.swahili_rule_history.length - 1
              ]
            : null;


    if (
        !lastHistoryEntry ||
        lastHistoryEntry.text !== answer ||
        lastHistoryEntry.stage !== swahiliStage
    ) {

        responses.swahili_rule_history.push({

            text: answer,

            stage: swahiliStage,

            timestamp: timestamp

        });

    }


    // Always save the latest explicitly submitted version.
    responses.swahili_rule = answer;

    responses.swahili_rule_latest_timestamp = timestamp;


    saveDataLocally();


    const button = document.querySelector(
        "#rule-form button[type='submit']"
    );

    if (button) {

        button.textContent = "Save revised rule";

    }


    const status = document.getElementById("rule-save-status");

    if (status) {

        status.textContent = "Your rule has been saved.";

    }

}


/* =========================================================
   CAPTURE INITIAL RULE IF NOT SUBMITTED
   ========================================================= */

function captureInitialRuleIfNeeded() {

    const responses = experimentData.responses;


    if (
        Object.prototype.hasOwnProperty.call(
            responses,
            "swahili_rule_initial"
        )
    ) {

        return;

    }


    const ruleInput = document.getElementById("swahili-rule");

    const initialRule = ruleInput
        ? ruleInput.value.trim()
        : "";

    const timestamp = new Date().toISOString();


    responses.swahili_rule_initial = initialRule;

    responses.swahili_rule_initial_timestamp = timestamp;

    responses.swahili_rule = initialRule;

    responses.swahili_rule_latest_timestamp = timestamp;


    if (!responses.swahili_rule_history) {

        responses.swahili_rule_history = [];

    }


    responses.swahili_rule_history.push({

        text: initialRule,

        stage: "rule",

        timestamp: timestamp,

        automatically_captured: true

    });


    recordEvent("swahili_initial_rule_captured", {

        rule: initialRule,

        timestamp: timestamp

    });


    saveDataLocally();

}


/* =========================================================
   SWAHILI ACTIVITY — STAGE 3
   HINTS AND RULE CORRECTION
   ========================================================= */
function startCorrectionStage() {

    if (swahiliStage !== "rule") {
        return;
    }

    swahiliStage = "correction";

    correctionTimeRemaining = CORRECTION_DURATION;

    recordEvent("swahili_correction_stage_started");

    const panel = document.getElementById("hint-panel");

    if (panel) {
        panel.hidden = false;
    }

    const aiPanel = document.getElementById("ai-chat-panel");

    const staticPanel = document.getElementById("static-hints-panel");

    if (aiPanel) {
        aiPanel.hidden = experimentMode !== "ai";
    }

    if (staticPanel) {
        staticPanel.hidden = experimentMode === "ai";
    }

    if (experimentMode === "non-ai") {

        hintUnlocked = [false, false, false];

        hintOpened = [false, false, false];

        initialiseHintAvailability();

        // First static hint becomes available immediately.
        unlockHint(0);

    } else {

        chatMessages = [];

        experimentData.responses.swahili_chat = [];

        saveDataLocally();

    }

    updateCorrectionTimerDisplay();

    correctionTimerInterval = setInterval(function () {

        correctionTimeRemaining--;

        updateCorrectionTimerDisplay();

        if (experimentMode === "non-ai") {

            const elapsed =
                CORRECTION_DURATION - correctionTimeRemaining;

            for (let i = 1; i < HINT_UNLOCK_TIMES.length; i++) {

                if (elapsed >= HINT_UNLOCK_TIMES[i]) {
                    unlockHint(i);
                }

            }

        }

        if (correctionTimeRemaining <= 0) {

            clearInterval(correctionTimerInterval);

            correctionTimerInterval = null;

            finishSwahiliActivity();

        }

    }, 1000);

}


function updateCorrectionTimerDisplay() {

    const timerId = experimentMode === "ai"
        ? "hint-timer"
        : "static-hint-timer";

    updateStageTimerDisplay(
        timerId,
        correctionTimeRemaining
    );

}


/* =========================================================
   SWAHILI ACTIVITY — FINISH
   ========================================================= */

function finishSwahiliActivity() {

    swahiliStage = "complete";

    // Only the non-AI group has static hints to unlock.
    if (experimentMode === "non-ai") {

        unlockHint(0);
        unlockHint(1);
        unlockHint(2);

    }

    recordEvent("swahili_activity_completed");

    updateStageTimerDisplay("hint-timer", 0);

    updateStageTimerDisplay("static-hint-timer", 0);

    // Disable chatbot input when time is over.
    const chatInput = document.getElementById("chat-input");

    const chatButton = document.getElementById("chat-send-button");

    if (chatInput) {
        chatInput.disabled = true;
    }

    if (chatButton) {
        chatButton.disabled = true;
    }

    const status = document.getElementById(
        "swahili-completion-message"
    );

    if (status) {
        status.hidden = false;
    }

    const continueButton = document.getElementById(
        "swahili-continue-button"
    );

    if (continueButton) {
        continueButton.disabled = false;
    }

    saveDataLocally();

}


/* =========================================================
   GENERIC STAGE TIMER DISPLAY
   ========================================================= */

function updateStageTimerDisplay(elementId, seconds) {

    const timer = document.getElementById(elementId);

    if (!timer) {
        return;
    }


    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;


    timer.textContent =

        String(minutes).padStart(2, "0") +

        ":" +

        String(remainingSeconds).padStart(2, "0");

}


/* =========================================================
   HINT PANEL — INITIALISATION
   ========================================================= */

function initialiseHints() {

    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        button.addEventListener("click", function () {

            const hintIndex = Number(button.dataset.hint);


            if (!hintUnlocked[hintIndex]) {

                alert(
                    "This hint is not available yet. Please wait until the correction stage begins."
                );

                return;

            }


            openHint(hintIndex);

        });

    });

}


/* =========================================================
   HINT PANEL — INITIAL AVAILABILITY
   ========================================================= */

function initialiseHintAvailability() {

    document.querySelectorAll(".hint-content").forEach(function (content) {

        content.hidden = true;

    });


    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        button.disabled = true;

        button.setAttribute("aria-expanded", "false");

        button.style.opacity = "0.5";

        button.style.cursor = "not-allowed";

    });

}


/* =========================================================
   HINT PANEL — UNLOCK HINTS
   ========================================================= */

function unlockHint(index) {

    if (index < 0 || index > 2) {
        return;
    }


    if (hintUnlocked[index]) {
        return;
    }


    hintUnlocked[index] = true;


    const button = document.querySelector(

        '.hint-toggle[data-hint="' + index + '"]'

    );


    if (button) {

        button.disabled = false;

        button.style.opacity = "1";

        button.style.cursor = "pointer";

    }


    recordEvent("hint_unlocked", {

    hint_number: index + 1,

    time_elapsed:
        CORRECTION_DURATION - correctionTimeRemaining

});

}


/* =========================================================
   HINT PANEL — OPEN INDIVIDUAL HINT
   ========================================================= */

function openHint(index) {

    if (index < 0 || index > 2) {
        return;
    }


    if (!hintUnlocked[index]) {
        return;
    }


    const content = document.getElementById(

        "hint-content-" + index

    );


    if (!content) {
        return;
    }


    const selectedButton = document.querySelector(

        '.hint-toggle[data-hint="' + index + '"]'

    );


    // Clicking an already-open hint closes it.
    if (content.hidden === false) {

        content.hidden = true;


        if (selectedButton) {

            selectedButton.setAttribute(
                "aria-expanded",
                "false"
            );


            const symbol = selectedButton.querySelector("span");

            if (symbol) {

                symbol.textContent = "+";

            }

        }


        recordEvent("hint_closed", {

            hint_number: index + 1

        });


        return;

    }


    // Close all other hints.
    document.querySelectorAll(".hint-content").forEach(function (item) {

        item.hidden = true;

    });


    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        button.setAttribute("aria-expanded", "false");


        const symbol = button.querySelector("span");

        if (symbol) {

            symbol.textContent = "+";

        }

    });


    // Open selected hint.
    content.hidden = false;


    if (selectedButton) {

        selectedButton.setAttribute(
            "aria-expanded",
            "true"
        );


        const symbol = selectedButton.querySelector("span");

        if (symbol) {

            symbol.textContent = "−";

        }

    }


    // Log first opening only.
    if (!hintOpened[index]) {

        hintOpened[index] = true;


        recordEvent("hint_opened", {

            hint_number: index + 1

        });

    }

}

/* =========================================================
   AI CHATBOT
   ========================================================= */

function initialiseChat() {

    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");

    if (!form || !input) return;

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (
            experimentMode !== "ai" ||
            swahiliStage !== "correction" ||
            chatRequestInProgress
        ) {
            return;
        }

        const message = input.value.trim();

        if (!message) return;

        // Add the participant's message to the transcript.
        chatMessages.push({
            role: "user",
            content: message,
            timestamp: new Date().toISOString()
        });

        appendChatMessage("user", message);

        input.value = "";

        saveChatTranscript();

        recordEvent("chat_message_sent", {
            message_number: chatMessages.length
        });

        await requestChatbotReply();
    });

}


function appendChatMessage(role, message) {

    const container = document.getElementById("chat-messages");

    if (!container) return;

    const bubble = document.createElement("div");

    bubble.className = "chat-message " + role;

    const heading = document.createElement("strong");

    heading.textContent =
        role === "user" ? "You" : "Rosetta tutor";

    const paragraph = document.createElement("p");

    // textContent prevents messages from being interpreted as HTML.
    paragraph.textContent = message;

    bubble.appendChild(heading);

    bubble.appendChild(paragraph);

    container.appendChild(bubble);

    container.scrollTop = container.scrollHeight;
}


function saveChatTranscript() {

    experimentData.responses.swahili_chat = chatMessages;

    saveDataLocally();
}


async function requestChatbotReply() {

    const input = document.getElementById("chat-input");
    const button = document.getElementById("chat-send-button");
    const status = document.getElementById("chat-status");

    chatRequestInProgress = true;

    if (input) input.disabled = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Tutor is thinking...";
    }

    if (status) {
        status.textContent = "The tutor is thinking...";
    }

    try {

        const ruleInput = document.getElementById("swahili-rule");

        const currentRule = ruleInput
            ? ruleInput.value.trim()
            : "";

        const response = await fetch(CHAT_API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                messages: chatMessages.map(function (message) {
                    return {
                        role: message.role,
                        content: message.content
                    };
                }),

                currentRule: currentRule,

                participantId: participantId

            })

        });


        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "The chatbot could not respond."
            );

        }

        if (!data.reply) {

            throw new Error("The chatbot returned an empty response.");

        }


        chatMessages.push({

            role: "assistant",

            content: data.reply,

            timestamp: new Date().toISOString()

        });

        appendChatMessage("assistant", data.reply);

        saveChatTranscript();

        recordEvent("chat_reply_received", {
            message_number: chatMessages.length
        });

        if (status) {
            status.textContent = "";
        }

    } catch (error) {

        console.error("Chatbot error:", error);

        if (status) {

            status.textContent =
                "Sorry, the tutor could not respond. Please try again.";

        }

        recordEvent("chat_request_failed", {
            error: String(error.message || error)
        });

    } finally {

        chatRequestInProgress = false;

        // The correction timer may have expired while waiting.
        const activityStillOpen =
            swahiliStage === "correction";

        if (input) {
            input.disabled = !activityStillOpen;
        }

        if (button) {
            button.disabled = !activityStillOpen;
            button.textContent = "Send message →";
        }

    }

}


/* =========================================================
   DOWNLOAD RESPONSE DATA
   ========================================================= */

function initialiseDownload() {

    const button = document.getElementById("download-data");

    if (!button) {
        return;
    }


    button.addEventListener("click", downloadResponses);

}


function downloadResponses() {

    experimentData.exported_at = new Date().toISOString();

    saveDataLocally();


    const json = JSON.stringify(experimentData, null, 2);

    const blob = new Blob(

        [json],

        { type: "application/json" }

    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");


    link.href = url;

    link.download =

        "rosetta_unit1_" + participantId + ".json";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);


    recordEvent("responses_downloaded");

}


/* =========================================================
   REVEAL WORKED EXAMPLE AFTER OBSERVATIONS ARE SUBMITTED
   ========================================================= */

const observationForm = document.getElementById("discover-form");
const workedExample = document.getElementById("worked-example");

if (observationForm && workedExample) {
    observationForm.addEventListener("submit", function () {
        workedExample.hidden = false;
    });
}


/* =========================================================
   END OF SCRIPT
   ========================================================= */


