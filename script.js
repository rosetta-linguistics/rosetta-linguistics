
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

let preTimerInterval = null;
let postTimerInterval = null;
let hintTimerInterval = null;

let preTimeRemaining = 15 * 60;
let postTimeRemaining = 15 * 60;
let hintTimeRemaining = 5 * 60;

let hintOpened = [false, false, false];
let hintPanelClosed = false;


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
    initialiseDownload();

    showScreen(0);

    startTimer("pre-timer", 15 * 60, "pre");
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

        console.error("Could not save experiment data:", error);

    }
}


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function initialiseNavigation() {

    document.querySelectorAll("[data-next]").forEach(function (button) {

        button.addEventListener("click", function () {

            const nextScreen = Number(button.dataset.next);

            if (nextScreen === 5 && !experimentData.responses.swahili_rule) {

                alert("Please submit your rule before continuing.");
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

    document.querySelectorAll(".experiment-step").forEach(function (screen) {

        screen.classList.remove("active");

    });

    const target = document.getElementById("screen-" + screenNumber);

    if (!target) {
        return;
    }

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
        recordEvent("discover_screen_opened");
    }

    if (screenNumber === 2) {
        recordEvent("worked_example_opened");
    }

    if (screenNumber === 3) {
        recordEvent("swahili_screen_opened");
    }

    if (screenNumber === 4) {
        recordEvent("rule_screen_opened");
    }

    if (screenNumber === 5) {

        if (!postTimerInterval) {
            startTimer("post-timer", postTimeRemaining, "post");
        }
    }

}


/* =========================================================
   FORM INITIALISATION
   ========================================================= */

function initialiseForms() {

    const pretestForm = document.getElementById("pretest-form");

    if (pretestForm) {

        pretestForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answers = getFormAnswers(pretestForm);

            experimentData.responses.pretest = answers;

            experimentData.scores.pretest = gradePretest(answers);

            recordEvent("pretest_submitted", {
                score: experimentData.scores.pretest.total
            });

            stopTimer("pre");

            saveDataLocally();

            showScreen(1);

        });
    }


    const discoverForm = document.getElementById("discover-form");

    if (discoverForm) {

        discoverForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answers = getFormAnswers(discoverForm);

            experimentData.responses.discover = answers;

            recordEvent("discover_response_saved");

            saveDataLocally();

            showScreen(2);

        });
    }


    const swahiliForm = document.getElementById("swahili-form");

    if (swahiliForm) {

        swahiliForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answers = getFormAnswers(swahiliForm);

            experimentData.responses.swahili = answers;

            const results = gradeSwahili(answers);

            experimentData.scores.swahili = results;

            displaySwahiliFeedback(results);

            recordEvent("swahili_answers_submitted", {
                score: results.total
            });

            saveDataLocally();

            const button = swahiliForm.querySelector("button[type='submit']");

            if (button) {

                button.disabled = true;
                button.textContent = "Answers submitted";

            }

            swahiliForm.querySelectorAll("input").forEach(function (input) {
                input.disabled = true;
            });

            // Move to the rule-writing screen.
            setTimeout(function () {
                showScreen(4);
            }, 1800);

        });
    }


    const ruleForm = document.getElementById("rule-form");

    if (ruleForm) {

        const ruleInput = document.getElementById("swahili-rule");

        if (ruleInput) {

            ruleInput.addEventListener("input", function () {

                if (!experimentData.responses.swahili_rule_revisions) {
                    experimentData.responses.swahili_rule_revisions = [];
                }

                experimentData.responses.swahili_rule_revisions.push({
                    text: ruleInput.value,
                    timestamp: new Date().toISOString()
                });

                experimentData.responses.swahili_rule = ruleInput.value;

                saveDataLocally();

            });

        }


        ruleForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answer = ruleInput.value.trim();

            if (!answer) {
                alert("Please write your rule before continuing.");
                return;
            }

            experimentData.responses.swahili_rule = answer;

            recordEvent("swahili_rule_submitted");

            saveDataLocally();

            openHintPanel();

        });
    }


    const posttestForm = document.getElementById("posttest-form");

    if (posttestForm) {

        posttestForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const answers = getFormAnswers(posttestForm);

            experimentData.responses.posttest = answers;

            experimentData.scores.posttest = gradePosttest(answers);

            recordEvent("posttest_submitted", {
                score: experimentData.scores.posttest.total
            });

            stopTimer("post");

            experimentData.completed_at = new Date().toISOString();

            saveDataLocally();

            showScreen(6);

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

        answers[key] = value.trim();

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
   Answers are stored and scored, but no feedback is shown.
   ========================================================= */

function gradePretest(a) {

    const matchKeys = [
        ["we will fight", "we'll fight"],
        ["they will curse me", "they'll curse me"],
        ["you will fall in love with me", "you (sg) will fall in love with me"],
        ["we will argue"]
    ];

    let matchCorrect = 0;

    for (let i = 1; i <= 4; i++) {

        if (answerMatches(a["pre_match_" + i], matchKeys[i - 1])) {
            matchCorrect++;
        }

    }

    // Rubric: all four matches = 2 points; three = 1 point.
    const matchScore =
        matchCorrect === 4 ? 2 :
        matchCorrect === 3 ? 1 : 0;


    const segmentationKeys = [
        ["di-cha-kadha-na", "di cha kadha na"],
        ["bhi-cha-ni-rasha", "bhi cha ni rasha"]
    ];

    let segmentationScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (answerMatches(a["pre_seg_" + i], segmentationKeys[i - 1])) {
            segmentationScore++;
        }

    }


    const applyKeys = [
        ["nichakukadha"],
        ["bhichakundana"],
        ["mucharashana"]
    ];

    let applyScore = 0;

    for (let i = 1; i <= 3; i++) {

        if (answerMatches(a["pre_apply_" + i], applyKeys[i - 1])) {
            applyScore++;
        }

    }


    const transferKeys = [
        ["kuchabhirasha"],
        ["dichamukunda"]
    ];

    let transferScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (answerMatches(a["pre_transfer_" + i], transferKeys[i - 1])) {
            transferScore++;
        }

    }


    const ruleScore = gradeDabidaRule(a.pre_rule);

    return {
        matches_correct: matchCorrect,
        match_score: matchScore,
        segmentation_score: segmentationScore,
        apply_score: applyScore,
        transfer_score: transferScore,
        rule_score: ruleScore,
        total: matchScore + segmentationScore + applyScore + transferScore + ruleScore
    };

}


function gradeDabidaRule(text) {

    const rule = normalise(text);

    if (!rule) {
        return 0;
    }

    let score = 0;

    if (
        rule.includes("prefix") ||
        rule.includes("beginning") ||
        rule.includes("start")
    ) {
        score++;
    }

    if (
        rule.includes("subject") ||
        rule.includes("person") ||
        rule.includes("who")
    ) {
        score++;
    }

    if (
        rule.includes("object") ||
        rule.includes("verb") ||
        rule.includes("future") ||
        rule.includes("order")
    ) {
        score++;
    }

    return Math.min(score, 3);
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
            answerMatches(a["swahili_" + i], keys[i - 1])
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
   Answers are stored and scored, but no feedback is shown.
   ========================================================= */

function gradePosttest(a) {

    const matchKeys = [
        ["oak"],
        ["of the oak"],
        ["of the doctor"],
        ["of the doctors"]
    ];

    let matchCorrect = 0;

    for (let i = 1; i <= 4; i++) {

        if (answerMatches(a["post_match_" + i], matchKeys[i - 1])) {
            matchCorrect++;
        }

    }

    const matchScore =
        matchCorrect === 4 ? 2 :
        matchCorrect === 3 ? 1 : 0;


    const segmentationKeys = [
        ["ozol-a", "ozol a"],
        ["ārst-u", "arst-u", "arst u", "ārst u"]
    ];

    let segmentationScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (answerMatches(a["post_seg_" + i], segmentationKeys[i - 1])) {
            segmentationScore++;
        }

    }


    const applyKeys = [
        ["ābola", "abola"],
        ["bērna", "berna"],
        ["galda"]
    ];

    let applyScore = 0;

    for (let i = 1; i <= 3; i++) {

        if (answerMatches(a["post_apply_" + i], applyKeys[i - 1])) {
            applyScore++;
        }

    }


    const transferKeys = [
        ["autora"],
        ["institūtu", "institutu"]
    ];

    let transferScore = 0;

    for (let i = 1; i <= 2; i++) {

        if (answerMatches(a["post_transfer_" + i], transferKeys[i - 1])) {
            transferScore++;
        }

    }


    const ruleScore = gradeLatvianRule(a.post_rule);

    return {
        matches_correct: matchCorrect,
        match_score: matchScore,
        segmentation_score: segmentationScore,
        apply_score: applyScore,
        transfer_score: transferScore,
        rule_score: ruleScore,
        total: matchScore + segmentationScore + applyScore + transferScore + ruleScore
    };

}


function gradeLatvianRule(text) {

    const rule = normalise(text);

    if (!rule) {
        return 0;
    }

    let score = 0;

    if (rule.includes("s")) {
        score++;
    }

    if (
        rule.includes("a") &&
        (rule.includes("singular") || rule.includes("one"))
    ) {
        score++;
    }

    if (
        rule.includes("u") &&
        (rule.includes("plural") || rule.includes("several") || rule.includes("many"))
    ) {
        score++;
    }

    return Math.min(score, 3);
}


/* =========================================================
   COUNTDOWN TIMERS
   ========================================================= */

function startTimer(elementId, seconds, timerType) {

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
            preTimeRemaining = seconds;
        } else if (timerType === "post") {
            postTimeRemaining = seconds;
        }

        updateDisplay();

        if (seconds <= 0) {

            clearInterval(interval);

            if (timerType === "pre") {
                preTimerInterval = null;
                autoSubmitAssessment("pretest-form", 0);
            }

            if (timerType === "post") {
                postTimerInterval = null;
                autoSubmitAssessment("posttest-form", 6);
            }

        }

    }, 1000);

    if (timerType === "pre") {
        preTimerInterval = interval;
    } else {
        postTimerInterval = interval;
    }

}


function stopTimer(timerType) {

    if (timerType === "pre" && preTimerInterval) {

        clearInterval(preTimerInterval);
        preTimerInterval = null;

    }

    if (timerType === "post" && postTimerInterval) {

        clearInterval(postTimerInterval);
        postTimerInterval = null;

    }

}


function autoSubmitAssessment(formId, nextScreen) {

    const form = document.getElementById(formId);

    if (!form) {
        return;
    }

    const answers = getFormAnswers(form);

    if (formId === "pretest-form") {

        experimentData.responses.pretest = answers;
        experimentData.scores.pretest = gradePretest(answers);

        recordEvent("pretest_time_expired");

    } else {

        experimentData.responses.posttest = answers;
        experimentData.scores.posttest = gradePosttest(answers);

        experimentData.completed_at = new Date().toISOString();

        recordEvent("posttest_time_expired");

    }

    saveDataLocally();

    form.querySelectorAll("input, textarea, button").forEach(function (element) {
        element.disabled = true;
    });

    alert("Time is up. Your answers have been saved.");

    showScreen(nextScreen);

}


/* =========================================================
   HINT PANEL
   ========================================================= */

function initialiseHints() {

    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        button.addEventListener("click", function () {

            const hintIndex = Number(button.dataset.hint);

            openHint(hintIndex);

        });

    });

}


function openHintPanel() {

    const panel = document.getElementById("hint-panel");

    if (!panel) {
        return;
    }

    panel.hidden = false;

    hintPanelClosed = false;

    hintTimeRemaining = 5 * 60;

    recordEvent("hint_panel_opened");

    startHintTimer();

}


function openHint(index) {

    if (hintPanelClosed || index < 0 || index > 2) {
        return;
    }

    const content = document.getElementById("hint-content-" + index);

    if (!content || content.hidden === false) {
        return;
    }

    // Close all other hints: only one can be open at a time.
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


    // Open the selected hint.
    content.hidden = false;

    const selectedButton = document.querySelector(
        '.hint-toggle[data-hint="' + index + '"]'
    );

    if (selectedButton) {

        selectedButton.setAttribute("aria-expanded", "true");

        const symbol = selectedButton.querySelector("span");

        if (symbol) {
            symbol.textContent = "−";
        }

    }


    if (!hintOpened[index]) {

        hintOpened[index] = true;

        recordEvent("hint_opened", {
            hint_number: index + 1
        });

    }

}


function startHintTimer() {

    const timer = document.getElementById("hint-timer");

    if (!timer) {
        return;
    }

    updateHintTimerDisplay();

    if (hintTimerInterval) {
        clearInterval(hintTimerInterval);
    }

    hintTimerInterval = setInterval(function () {

        hintTimeRemaining--;

        updateHintTimerDisplay();

        if (hintTimeRemaining <= 0) {

            clearInterval(hintTimerInterval);
            hintTimerInterval = null;

            closeHintPanel();

        }

    }, 1000);

}


function updateHintTimerDisplay() {

    const timer = document.getElementById("hint-timer");

    if (!timer) {
        return;
    }

    const minutes = Math.floor(hintTimeRemaining / 60);
    const seconds = hintTimeRemaining % 60;

    timer.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

}


function closeHintPanel() {

    const panel = document.getElementById("hint-panel");

    if (!panel) {
        return;
    }

    panel.hidden = true;

    hintPanelClosed = true;

    document.querySelectorAll(".hint-content").forEach(function (item) {
        item.hidden = true;
    });

    recordEvent("hint_panel_closed");

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
   END OF SCRIPT
   ========================================================= */
