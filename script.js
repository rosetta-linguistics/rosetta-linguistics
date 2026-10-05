/* =========================================================
   ROSETTA EXPERIMENT
   Main JavaScript
   ========================================================= */


/* =========================================================
   EXPERIMENT STATE
   ========================================================= */

let experimentMode = "ai";
let currentHint = 1;


/* =========================================================
   INITIALISE EXPERIMENT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /*
     * The homepage sends the participant to:
     *
     * experiment.html?mode=ai
     *
     * or:
     *
     * experiment.html?mode=non-ai
     */

    const params = new URLSearchParams(window.location.search);

    const requestedMode = params.get("mode");

    if (requestedMode === "non-ai") {
        experimentMode = "non-ai";
    } else {
        experimentMode = "ai";
    }


    /*
     * Store the mode on the body so that it is easy
     * to inspect elsewhere in the experiment.
     */

    document.body.dataset.experimentMode = experimentMode;


    /*
     * Only perform experiment-specific setup if
     * we are actually on experiment.html.
     */

    if (document.getElementById("activity")) {
        initialiseExperiment();
    }

});


/* =========================================================
   SET UP AI / NON-AI CONDITION
   ========================================================= */

function initialiseExperiment() {

    const activity = document.getElementById("activity");
    const staticHelp = document.getElementById("static-help");

    /*
     * On the experiment page, the AI chat is the .chat
     * element that is NOT #static-help.
     */

    const chats = document.querySelectorAll(".chat");

    let aiChat = null;

    chats.forEach(function (chat) {

        if (chat.id !== "static-help") {
            aiChat = chat;
        }

    });


    /* -----------------------------------------
       NON-AI CONDITION
       ----------------------------------------- */

    if (experimentMode === "non-ai") {

        if (aiChat) {
            aiChat.style.display = "none";
        }

        if (staticHelp) {
            staticHelp.style.display = "block";
        }


        /*
         * Change the explanatory text so that the
         * participant knows they are using static hints.
         */

        const lead =
            document.querySelector("#activity .lead");

        if (lead) {

            lead.textContent =
                "Here, you are given 3 Swahili words, as well as their English meaning. " +
                "Try to work out how the words are constructed. " +
                "Use the four hints when you get stuck, and explain your reasoning in your own words.";

        }


        /*
         * Change the heading slightly.
         */

        const heading =
            document.querySelector("#activity h1");

        if (heading) {
            heading.textContent = "Discover the pattern with hints";
        }

    }


    /* -----------------------------------------
       AI CONDITION
       ----------------------------------------- */

    else {

        if (aiChat) {
            aiChat.style.display = "block";
        }

        if (staticHelp) {
            staticHelp.style.display = "none";
        }

    }


    /*
     * Make sure Step 1 is visible.
     */

    if (activity) {
        activity.classList.add("active");
    }


    /*
     * Make sure Step 2 and Step 3 are hidden.
     */

    const finalStep = document.getElementById("final");
    const completeStep = document.getElementById("complete");

    if (finalStep) {
        finalStep.classList.remove("active");
    }

    if (completeStep) {
        completeStep.classList.remove("active");
    }


    /*
     * Set progress indicator.
     */

    const stepNumber =
        document.getElementById("step-number");

    if (stepNumber) {
        stepNumber.textContent = "1";
    }


    /*
     * Reset static hints.
     */

    resetHints();
}


/* =========================================================
   RESET STATIC HINTS
   ========================================================= */

function resetHints() {

    currentHint = 1;


    /*
     * Hint 1 should be visible.
     */

    const hint1 =
        document.getElementById("hint-1");

    if (hint1) {
        hint1.style.display = "block";
    }


    /*
     * Hints 2–4 should initially be hidden.
     */

    for (let i = 2; i <= 4; i++) {

        const hint =
            document.getElementById("hint-" + i);

        if (hint) {
            hint.style.display = "none";
        }

    }


    /*
     * Reset the hint button.
     */

    const button =
        document.getElementById("next-hint-button");

    if (button) {

        button.textContent =
            "Open next hint";

        button.disabled = false;
    }

}


/* =========================================================
   STATIC HINTS
   ========================================================= */

function showNextHint() {

    const nextHint = currentHint + 1;


    /*
     * Show the next hint.
     */

    if (nextHint <= 4) {

        const hint =
            document.getElementById(
                "hint-" + nextHint
            );

        if (hint) {

            hint.style.display = "block";

            currentHint = nextHint;
        }

    }


    /*
     * Once all four hints have been opened,
     * disable the button.
     */

    if (currentHint >= 4) {

        const button =
            document.getElementById(
                "next-hint-button"
            );

        if (button) {

            button.textContent =
                "All four hints opened";

            button.disabled = true;
        }

    }

}


/* =========================================================
   REVEAL CORRECT RULE
   ========================================================= */

function revealRule() {

    const explanation =
        document.getElementById(
            "rule-explanation"
        );


    /*
     * The participant must first write
     * their own explanation.
     */

    if (
        !explanation ||
        !explanation.value.trim()
    ) {

        alert(
            "Please explain the rule in your own words before revealing the correct rule."
        );

        return;
    }


    /*
     * Reveal the correct rule.
     */

    const correctRule =
        document.getElementById(
            "correct-rule"
        );

    if (correctRule) {
        correctRule.style.display = "block";
    }


    /*
     * Disable the reveal button.
     */

    const button =
        document.getElementById(
            "reveal-rule-button"
        );

    if (button) {
        button.disabled = true;
    }

}


/* =========================================================
   STEP 1 → STEP 2
   ========================================================= */

function showFinalTask() {

    /*
     * In the non-AI condition, the participant must
     * explain the rule and reveal the correct rule
     * before continuing.
     */

    if (experimentMode === "non-ai") {

        const explanation =
            document.getElementById(
                "rule-explanation"
            );

        const correctRule =
            document.getElementById(
                "correct-rule"
            );


        const explanationMissing =
            !explanation ||
            !explanation.value.trim();


        const ruleStillHidden =
            !correctRule ||
            correctRule.style.display === "none";


        if (
            explanationMissing ||
            ruleStillHidden
        ) {

            alert(
                "Please write your explanation and reveal the correct rule before continuing."
            );

            return;
        }

    }


    /*
     * Hide Step 1.
     */

    const activity =
        document.getElementById(
            "activity"
        );

    if (activity) {
        activity.classList.remove("active");
    }


    /*
     * Show Step 2.
     */

    const finalStep =
        document.getElementById(
            "final"
        );

    if (finalStep) {
        finalStep.classList.add("active");
    }


    /*
     * Update progress.
     */

    const stepNumber =
        document.getElementById(
            "step-number"
        );

    if (stepNumber) {
        stepNumber.textContent = "2";
    }


    /*
     * Scroll to the top.
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   STEP 2 → STEP 3
   ========================================================= */

function finishActivity() {

    const answer =
        document.getElementById("final-answer");

    const correctAnswer =
        document.getElementById("final-correct-answer");


    /*
     * Make sure the participant has submitted
     * an answer before showing the solution.
     */

    if (!answer || !answer.value.trim()) {

        alert(
            "Please write your answer before submitting."
        );

        return;
    }


    /*
     * Show the correct answer.
     */

    if (correctAnswer) {

        correctAnswer.style.display = "block";

    }


    /*
     * Change the button so the participant knows
     * the answer has been submitted.
     */

    const button =
        document.querySelector(
            "#final .navigation .primary-button"
        );

    if (button) {

        /*
         * First click:
         * show the answer.
         */

        if (button.dataset.answerShown !== "true") {

            button.dataset.answerShown = "true";

            button.textContent =
                "Continue →";

            return;
        }

        /*
         * Second click:
         * go to completion.
         */

    }


    /*
     * Hide Step 2.
     */

    const finalStep =
        document.getElementById("final");

    if (finalStep) {
        finalStep.classList.remove("active");
    }


    /*
     * Show completion screen.
     */

    const completeStep =
        document.getElementById("complete");

    if (completeStep) {
        completeStep.classList.add("active");
    }


    /*
     * Update progress.
     */

    const stepNumber =
        document.getElementById("step-number");

    if (stepNumber) {
        stepNumber.textContent = "3";
    }


    /*
     * Scroll to the top.
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   AI CHAT
   ========================================================= */

function sendMessage() {

    const input =
        document.getElementById(
            "user-input"
        );


    /*
     * Safety check in case the AI chat
     * is not present.
     */

    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    /*
     * Do nothing if the participant
     * submitted an empty message.
     */

    if (!text) {
        return;
    }


    /*
     * Display the participant's message.
     */

    addMessage(
        "user",
        text
    );


    /*
     * Clear the input box.
     */

    input.value = "";


    /*
     * TEMPORARY AI RESPONSE
     *
     * Replace this section later with
     * your actual AI API call.
     */

    setTimeout(function () {

        addMessage(
            "tutor",
            "-- the AI message will be appended here --"
        );

    }, 600);

}


/* =========================================================
   ADD MESSAGE TO CHAT
   ========================================================= */

function addMessage(sender, text) {

    const messages =
        document.getElementById(
            "messages"
        );


    /*
     * Safety check.
     */

    if (!messages) {
        return;
    }


    /*
     * Create message container.
     */

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message " + sender;


    /*
     * Determine label.
     */

    const label =
        sender === "user"
            ? "You"
            : "Tutor";


    /*
     * Add message HTML.
     *
     * escapeHTML() is used so that participant
     * input cannot be interpreted as HTML.
     */

    message.innerHTML = `
        <div class="message-label">
            ${label}
        </div>

        <div class="bubble">
            ${escapeHTML(text)}
        </div>
    `;


    /*
     * Add message to chat.
     */

    messages.appendChild(
        message
    );


    /*
     * Scroll to newest message.
     */

    messages.scrollTop =
        messages.scrollHeight;

}


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}