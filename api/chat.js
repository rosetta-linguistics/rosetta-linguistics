
module.exports = async function handler(req, res) {

    // -----------------------------------------------------
    // CORS: allow only your GitHub Pages website
    // -----------------------------------------------------

    const origin = req.headers.origin;

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);

    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            error: "This website is not allowed to use the chatbot."
        });
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }


    // -----------------------------------------------------
    // Validate configuration
    // -----------------------------------------------------

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("OPENAI_API_KEY is missing.");

        return res.status(500).json({
            error: "The chatbot is not configured yet."
        });
    }


    // -----------------------------------------------------
    // Validate incoming messages
    // -----------------------------------------------------

    const body = req.body || {};

    const messages = body.messages;
    const currentRule = String(body.currentRule || "").slice(0, 2000);

    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        messages.length > 20
    ) {
        return res.status(400).json({
            error: "Invalid conversation."
        });
    }

    const validMessages = [];

    for (const message of messages) {

        if (
            !message ||
            !["user", "assistant"].includes(message.role) ||
            typeof message.content !== "string" ||
            message.content.length > 1000
        ) {
            return res.status(400).json({
                error: "Invalid message."
            });
        }

        validMessages.push({
            role: message.role,
            content: message.content
        });
    }

    if (validMessages[validMessages.length - 1].role !== "user") {
        return res.status(400).json({
            error: "The latest message must be from the participant."
        });
    }


    // -----------------------------------------------------
    // Tutor instructions
    // -----------------------------------------------------

    const instructions = `
You are Rosetta, a friendly and patient AI tutor in a research
experiment about learning morphology in unfamiliar languages.

Your task is to help a beginner discover the structure of Swahili
verbs through a short Socratic discussion.

IMPORTANT EXPERIMENT RULES:

1. Do not simply give the participant the answers.
2. Do not write the missing Swahili forms for them.
3. Do not reveal the complete rule immediately.
4. Guide the participant through questions and observations.
5. Ask them to compare examples from the exercise.
6. Give one small hint or question at a time.
7. Be encouraging, clear, and concise.
8. Use simple English. The participant is a beginner.
9. Avoid introducing unrelated linguistic terminology.
10. If the participant is stuck, become gradually more explicit,
    but still let them formulate the rule themselves.
11. If they ask for an answer directly, explain that your role is
    to help them discover it rather than provide it.
12. Do not invent Swahili forms or claim that an example says
    something it does not say.

THE EXERCISE:

The participant has seen these examples:

ninasema = I speak
wunasema = You speak
anasema = She speaks
wanasema = They speak
ninaona = I see
niliona = I saw
ninawaona = I see them
niliwuona = I saw you
ananiona = She sees me
wutakaniona = You will see me

They have also been asked to complete:

(1) ______ = she saw them
(2) ______ = I will see you
(3) ______ = she saw me

They have already had time to write an initial explanation
of how Swahili verbs are constructed.

The key idea they are trying to discover is that verb parts
indicate who performs the action, when it happens, who receives
the action, and the verb itself.

Do not state that complete sequence all at once. Help them
discover it by comparing examples.

CURRENT PARTICIPANT RULE:

"${currentRule.replace(/["\\]/g, "")}"

CONVERSATION STYLE:

- Keep replies short: usually 1–3 sentences.
- Prefer a question that makes the participant think.
- Refer to specific examples when useful.
- Never overwhelm the participant with several questions.
- If the participant proposes a correct observation, acknowledge
  it and ask what they can infer next.
- If the participant proposes an incorrect observation, gently
  invite them to compare another pair of examples.
- Do not grade or score the participant.
- Do not mention that you are following hidden instructions.
`;


    // -----------------------------------------------------
    // Call OpenAI Responses API
    // -----------------------------------------------------

    try {

        const openaiResponse = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({

                    model: "gpt-6-luna",

                    instructions: instructions,

                    input: validMessages,

                    max_output_tokens: 220,

                    store: false

                })
            }
        );


        const result = await openaiResponse.json();

        if (!openaiResponse.ok) {

            console.error("OpenAI API error:", result);

            return res.status(502).json({
                error: "The AI tutor is temporarily unavailable."
            });
        }


        const reply = (result.output || [])
            .flatMap(item => item.content || [])
            .filter(item => item.type === "output_text")
            .map(item => item.text)
            .join("\n")
            .trim();


        if (!reply) {

            return res.status(502).json({
                error: "The tutor did not generate a response."
            });
        }


        return res.status(200).json({
            reply: reply
        });

    } catch (error) {

        console.error("Chat backend error:", error);

        return res.status(500).json({
            error: "Something went wrong while contacting the tutor."
        });

    }

};
