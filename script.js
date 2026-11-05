/* =========================================================
   ROSETTA EXPERIMENT — UNIT 1
   Timer-free, non-blocking version
   ========================================================= */


/* =========================================================
   EXPERIMENT STATE
   ========================================================= */

let experimentMode = "ai";
let currentScreen = 0;

let participantId = null;
let experimentData = {};

let swahiliStage = "not_started";

const CHAT_API_URL =
    "https://rosetta-linguistics.vercel.app/api/chat";

let chatMessages = [];
let chatRequestInProgress = false;

let hintOpened = [false, false, false];
let hintUnlocked = [false, false, false];


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
    initialiseAssessmentProgression();
    initialiseChat();
    initialiseDownload();

    showScreen(0);
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

        button.addEventListener("click", function () {

            const nextScreen = Number(button.dataset.next);

            if (
                currentScreen === 2 &&
                swahiliStage !== "complete"
            ) {

                alert(
                    "Please finish the Swahili activity or click 'Finish this activity' first."
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


    const finishSwahiliButton =
        document.getElementById("finish-swahili-button");

    if (finishSwahiliButton) {

        finishSwahiliButton.addEventListener("click", function () {

            finishSwahiliActivity();
        });
    }
}


function showScreen(screenNumber) {

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

            const answers = getFormAnswers(pretestForm);

            experimentData.responses.pretest = answers;

            experimentData.scores.pretest = gradePretest(answers);

            recordEvent("pretest_submitted", {

                score: experimentData.scores.pretest.total,

                maximum: experimentData.scores.pretest.maximum,

                rule_response: answers.pre_rule || ""
            });

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

            recordEvent("discover_response_saved", {
                response: answers.discover_response || ""
            });

            saveDataLocally();

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

            // Empty rules are allowed.
            const answer = ruleInput.value.trim();

            saveSubmittedRule(answer);


            // The first rule submission moves to correction.
            if (swahiliStage === "rule") {

                startCorrectionStage();
            }
        });
    }


    /* -----------------------------------------------------
       POST-TEST
       ----------------------------------------------------- */

    const posttestForm = document.getElementById("posttest-form");

    if (posttestForm) {

        posttestForm.addEventListener("submit", function (event) {

            event.preventDefault();

            // Empty answers are allowed.
            const answers = getFormAnswers(posttestForm);

            experimentData.responses.posttest = answers;

            experimentData.scores.posttest = gradePosttest(answers);

            recordEvent("posttest_submitted", {

                score: experimentData.scores.posttest.total,

                maximum: experimentData.scores.posttest.maximum,

                rule_response: answers.post_rule || ""
            });

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
   Maximum score: 5
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
   Maximum score: 5
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
   SWAHILI ACTIVITY — STAGE 1
   PATTERN MATCHING
   ========================================================= */

function startPatternStage() {

    if (swahiliStage !== "not_started") {
        return;
    }

    swahiliStage = "pattern";

    recordEvent("swahili_pattern_stage_started");
}


/* =========================================================
   SWAHILI PATTERN MATCHING — SUBMISSION
   ========================================================= */

function submitSwahiliPattern() {

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

        unanswered: Object.values(answers).filter(function (answer) {
            return answer === "";
        }).length
    });


    saveDataLocally();


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


    // Proceed immediately to rule writing.
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

    const lesson = document.getElementById("lesson-text");

    if (lesson) {

        lesson.hidden = false;
    }

    recordEvent("swahili_rule_stage_started");
}


/* =========================================================
   SWAHILI RULE — SAVE SUBMITTED VERSION
   ========================================================= */

function saveSubmittedRule(answer) {

    const responses = experimentData.responses;

    const timestamp = new Date().toISOString();


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

    // Capture the initial rule if not explicitly saved.
    captureInitialRuleIfNeeded();

    swahiliStage = "correction";

    recordEvent("swahili_correction_stage_started");


    const panel = document.getElementById("hint-panel");

    if (panel) {

        panel.hidden = false;
    }


    const aiPanel = document.getElementById("ai-chat-panel");

    const staticPanel = document.getElementById(
        "static-hints-panel"
    );


    if (aiPanel) {

        aiPanel.hidden = experimentMode !== "ai";
    }


    if (staticPanel) {

        staticPanel.hidden = experimentMode === "ai";
    }


    if (experimentMode === "non-ai") {

        hintUnlocked = [true, true, true];

        hintOpened = [false, false, false];

        initialiseHintAvailability();

        unlockHint(0);
        unlockHint(1);
        unlockHint(2);

    } else {

        chatMessages = [];

        experimentData.responses.swahili_chat = [];

        saveDataLocally();
    }
}


/* =========================================================
   SWAHILI ACTIVITY — FINISH
   ========================================================= */

function finishSwahiliActivity() {

    if (swahiliStage === "complete") {
        return;
    }

    swahiliStage = "complete";


    recordEvent("swahili_activity_completed");


    // Keep the latest rule in the data, even if empty.
    const ruleInput = document.getElementById("swahili-rule");

    if (ruleInput) {

        experimentData.responses.swahili_rule_latest_unsubmitted =
            ruleInput.value.trim();
    }


    // Make all static hints available.
    if (experimentMode === "non-ai") {

        unlockHint(0);
        unlockHint(1);
        unlockHint(2);
    }


    const chatInput = document.getElementById("chat-input");

    const chatButton = document.getElementById("chat-send-button");


    if (chatInput) {

        chatInput.disabled = true;
    }


    if (chatButton) {

        chatButton.disabled = true;

        chatButton.textContent = "Activity finished";
    }


    const status = document.getElementById(
        "swahili-completion-message"
    );

    if (status) {

        status.hidden = false;

        status.textContent =
            "The activity is complete. You can now continue to the post-test.";
    }


    const continueButton = document.getElementById(
        "swahili-continue-button"
    );

    if (continueButton) {

        continueButton.disabled = false;
    }


    const finishButton = document.getElementById(
        "finish-swahili-button"
    );

    if (finishButton) {

        finishButton.disabled = true;

        finishButton.textContent = "Activity finished";
    }


    saveDataLocally();
}


/* =========================================================
   HINT PANEL — INITIALISATION
   ========================================================= */

function initialiseHints() {

    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        button.addEventListener("click", function () {

            const hintIndex = Number(button.dataset.hint);

            if (!hintUnlocked[hintIndex]) {
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

    // Hide all hint contents initially.
    document.querySelectorAll(".hint-content").forEach(function (content) {
        content.hidden = true;
    });

    // In the non-AI experiment, all hints are immediately available.
    document.querySelectorAll(".hint-toggle").forEach(function (button) {

        const index = Number(button.dataset.hint);

        button.disabled = false;

        button.setAttribute("aria-expanded", "false");

        button.style.opacity = "1";

        button.style.cursor = "pointer";

        hintUnlocked[index] = true;
    });
}


/* =========================================================
   HINT PANEL — UNLOCK HINTS
   ========================================================= */

function unlockHint(index) {

    if (index < 0 || index > 2) {
        return;
    }

    // Mark the hint as available.
    hintUnlocked[index] = true;

    const button = document.querySelector(
        '.hint-toggle[data-hint="' + index + '"]'
    );

    if (button) {

        button.disabled = false;

        button.style.opacity = "1";

        button.style.cursor = "pointer";
    }
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

    if (!form || !input) {
        return;
    }


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

        if (!message) {
            return;
        }


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


/* =========================================================
   CHAT MESSAGE DISPLAY
   ========================================================= */

function appendChatMessage(role, message) {

    const container = document.getElementById("chat-messages");

    if (!container) {
        return;
    }


    const bubble = document.createElement("div");

    bubble.className = "chat-message " + role;


    const heading = document.createElement("strong");

    heading.textContent =
        role === "user" ? "You" : "Rosetta tutor";


    const paragraph = document.createElement("p");

    paragraph.textContent = message;


    bubble.appendChild(heading);

    bubble.appendChild(paragraph);

    container.appendChild(bubble);

    container.scrollTop = container.scrollHeight;
}


/* =========================================================
   SAVE CHAT TRANSCRIPT
   ========================================================= */

function saveChatTranscript() {

    experimentData.responses.swahili_chat = chatMessages;

    saveDataLocally();
}


/* =========================================================
   REQUEST CHATBOT REPLY
   ========================================================= */

async function requestChatbotReply() {

    const input = document.getElementById("chat-input");

    const button = document.getElementById("chat-send-button");

    const status = document.getElementById("chat-status");


    chatRequestInProgress = true;


    if (input) {

        input.disabled = true;
    }


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

            throw new Error(
                "The chatbot returned an empty response."
            );
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
   PROGRESSIVE ASSESSMENT BLOCKS
   ========================================================= */

function initialiseAssessmentProgression() {

    document.querySelectorAll("[data-reveal]").forEach(function (button) {

        button.addEventListener("click", function () {

            const nextBlock = document.getElementById(
                button.dataset.reveal
            );

            if (nextBlock) {
                nextBlock.hidden = false;
            }

            // Hide the Continue button after it has been used.
            button.hidden = true;

        });

    });

}


/* =========================================================
   END OF SCRIPT
   ========================================================= */