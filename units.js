/* =========================================================
   ROSETTA — CONTENT FOR EACH UNIT
   Everything a participant reads or is graded on lives here.
   script.js turns this into the screens:
     0 pre-test · 1 discover · 2 practise · 3 post-test · 4 complete

   Answer keys: a list of accepted answers per item.
   Accents/punctuation are ignored when grading, unless the test
   sets `strict: true` (then accents count, e.g. ë vs e).
   Each pre/post-test `rule.answer` is the reference rule the AI
   grader compares the participant's explanation against (0–5), and
   `rule.patterns` lists the key patterns it checks one by one
   (never shown to the participant).
   Add `chars: [...]` to a test or practice to show buttons for
   letters that are hard to type (e.g. Latvian ā, ņ).
   ========================================================= */

const UNITS = {

  /* =======================================================
     UNIT 1 — Dabida (pre) · Zulu · Swahili · Latvian (post)
     ======================================================= */
  1: {
    label: "Unit 1 · Morphology",
    next: 2,

    pre: {
      name: "Dabida",
      heading: "Dabida. Study the examples and solve the translation tasks.",
      // Source: Neacșu 6.2 (Gilyarova, TurLom 2006). Orthography: δ is written dh; β is written bh.
      flag: "🇰🇪",
      spotlight: "Dabida (also known as Dawida or Taita) is a Bantu language spoken in the Taita Hills of southeastern Kenya.",
      panelTitle: "Dabida · Verb forms",
      examples: [
        ["dichakadhana", "We will fight"],
        ["bhichanirasha", "They will curse me"],
        ["kuchanikunda", "You (singular) will fall in love with me"],
        ["dichakurasha", "We will curse you (singular)"],
        ["dicharashana", "We will argue"],
        ["bhichamukunda", "They will fall in love with you (plural)"],
        ["muchadikadha", "You (plural) will beat us"],
        ["bhichakadhana", "They will fight"]
      ],
      task: "Compare the Dabida words with their English translations. Look for recurring parts and try to infer what each part means.",
      apply: {
        title: "Apply: write in Dabida (approx. 1 min)",
        items: [
          { label: "I will beat you (singular)", key: ["nichakukadha"] },
          { label: "They will fall in love", key: ["bhichakundana"] },
          { label: "You (plural) will argue", key: ["mucharashana"] }
        ]
      },
      transfer: {
        title: "Transfer: write in Dabida (approx. 1 min)",
        items: [
          { label: "You (singular) will curse them", key: ["kuchabhirasha"] },
          { label: "We will fall in love with you (plural)", key: ["dichamukunda"] }
        ]
      },
      rule: {
        title: "Explain the rule: how are Dabida verbs built? (approx. 1 min)",
        placeholder: "Explain how Dabida verbs are built...",
        answer: "A Dabida verb is built as: subject prefix + future marker cha + (object prefix) + verb stem. " +
          "Subject prefixes: ni- = I, ku- = you (singular), di- = we, mu- = you (plural), bhi- = they. " +
          "Object prefixes use the same forms: ni = me, ku = you (singular), di = us, mu = you (plural), bhi = them. " +
          "Stems: kadha = beat, rasha = curse, kunda = love. When there is no object, the verb takes the ending -na " +
          "(each other): kadhana = fight, rashana = argue, kundana = fall in love.",
        // The patterns the AI grader looks for in the participant's explanation.
        patterns: [
          "Who does the action comes first: ni = I, ku = you (singular), di = we, mu = you (plural), bhi = they.",
          "cha comes next and marks the future.",
          "Who receives the action comes after cha, with the same forms (ni = me, ku = you (singular), di = us, mu = you (plural), bhi = them), followed by the verb.",
          "When nobody receives the action, the verb ends in -na (kadhana = fight, rashana = argue, kundana = fall in love)."
        ]
      }
    },

    discover: {
      event: "zulu_discovery_and_worked_example_opened",
      heading: "Discover Zulu. Identify recurring parts in the words.",
      // Source: Neacșu 5.1 (Zulu, original).
      flag: "🇿🇦",
      spotlight: "Zulu (isiZulu) is one of South Africa’s official languages and is the country’s most widely spoken home language.",
      panelTitle: "Zulu · Words and meanings",
      examples: [
        ["umdwebi", "Painter"],
        ["abadwebi", "Painters"],
        ["abazingeli", "Hunters"],
        ["zingela", "To hunt"],
        ["umbulali", "Killer"],
        ["ababazi", "Carvers"]
      ],
      task: "Compare the words carefully. Which parts appear more than once? What might those parts represent?",
      placeholder: "Write what you notice about the words...",
      lessonTitle: "Prefixes, stems, and suffixes",
      lesson: `
        <p>Look at <strong>umdwebi</strong> and <strong>abadwebi</strong>. Both mean painter, but one is singular
          and one is plural. The part they share, <strong>dwebi</strong>, is the stem. What comes before it changes:
          <strong>um-</strong> for one painter, <strong>aba-</strong> for several.</p>
        <p>Now look at <strong>zingela</strong>, to hunt, next to <strong>abazingeli</strong>, hunters. The stem
          <strong>zingel</strong> is the same; the noun ends in <strong>-i</strong>, the verb in <strong>-a</strong>.</p>
        <p>So a Zulu word for a person who does something is built from three pieces: a prefix that says one or many,
          a stem, and the ending <strong>-i</strong>. Pieces that go before the stem are called prefixes, pieces after
          it suffixes.</p>
        <p><strong>Try it:</strong> killer is <strong>umbulali</strong>, so killers is
          <strong>aba + bulali = ababulali</strong>, and to kill is <strong>bulal + a = bulala</strong>.</p>`
    },

    practice: {
      prefix: "swahili",
      name: "Swahili",
      heading: "Swahili: complete the missing forms and discover the rule.",
      // Source: Neacșu 6.1 (Swahili, Sim). Printed solution removed.
      flag: "🇰🇪 🇹🇿",
      spotlight: "Swahili (Kiswahili) is a Bantu language that grew along the East African coast and is now widely used as a shared language across several countries in the region.",
      panelTitle: "Swahili · Verb forms",
      examples: [
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
      task: "Use the examples to identify how the beginning and ending of a verb relate to its meaning.",
      items: [
        { label: "(1) ______ = she saw them", key: ["aliwaona"] },
        { label: "(2) ______ = I will see you", key: ["nitakawuona"] },
        { label: "(3) ______ = she saw me", key: ["aliniona"] }
      ],
      ruleTitle: "Explain the rule: how is a Swahili verb built?",
      // Shown to the participant after they click "Finish this activity".
      solution: `
        <p>A Swahili verb is built from up to four pieces, always in the same order:
          <strong>who does it + when + to whom + the verb</strong>.</p>
        <ul>
          <li><strong>Who does it:</strong> ni = I, wu = you, a = she, wa = they</li>
          <li><strong>When:</strong> na = now, li = in the past, taka = in the future</li>
          <li><strong>To whom</strong> (only if there is someone): ni = me, wu = you, wa = them</li>
          <li><strong>The verb:</strong> sema = speak, ona = see</li>
        </ul>
        <p>So <strong>a + li + wa + ona = aliwaona</strong>, she saw them;
          <strong>ni + taka + wu + ona = nitakawuona</strong>, I will see you;
          <strong>a + li + ni + ona = aliniona</strong>, she saw me.</p>`,
      // For the AI tutor only (never shown): lets it check the learner's rule.
      ruleAnswer: "A Swahili verb is built as: subject + tense + (object) + verb stem. " +
        "Subject: ni = I, wu = you, a = she, wa = they. Tense: na = present, li = past, taka = future. " +
        "Object (optional): ni = me, wu = you, wa = them. Stems: sema = speak, ona = see.",
      rulePlaceholder: "Explain the order and meaning of the parts...",
      greeting: "Hi! Let's explore your rule together. What have you noticed about the different parts of the Swahili verbs?",
      hints: [
        "Look at the very beginning of each word. What does it tell you about the English?",
        "Compare ninaona and niliona. What changed in Swahili, and what changed in English?",
        "The order is always: who does it, then when, then to whom, then the verb."
      ]
    },

    post: {
      name: "Latvian",
      heading: "Latvian. Study the examples and solve the translation tasks.",
      // Source: Neacșu 5.14 (Rubinstein, MSK 1999), nouns only.
      flag: "🇱🇻",
      spotlight: "Latvian belongs to the Baltic branch of the Indo-European language family. Its closest living relative is Lithuanian.",
      panelTitle: "Latvian · Nouns and forms",
      chars: ["ā", "ē", "ī", "ū", "ņ", "š", "ž", "č", "ģ", "ķ", "ļ"],
      examples: [
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
      ],
      task: "Compare the different forms and investigate how their endings relate to their grammatical meaning.",
      apply: {
        title: "Apply: write in Latvian (approx. 1 min)",
        items: [
          { label: "of the apple", key: ["ābola"] },
          { label: "of the child", key: ["bērna"] },
          { label: "of the table", key: ["galda"] }
        ]
      },
      transfer: {
        title: "Transfer: write in Latvian (approx. 1 min)",
        note: "Vocabulary: autors = author · bruņinieks = knight · institūts = institute.",
        items: [
          { label: "of the author", key: ["autora"] },
          { label: "of the institutes", key: ["institūtu"] }
        ]
      },
      rule: {
        title: "Explain the rule: how do Latvian noun endings change? (approx. 1 min)",
        placeholder: "Explain the pattern you have identified...",
        answer: "The basic (singular) form of these Latvian nouns ends in -s. To say 'of the ...', the -s is replaced: " +
          "by -a for one (ozols → ozola, ārsts → ārsta) and by -u for more than one (autors → autoru, " +
          "bruņinieks → bruņinieku). The stem before the ending stays the same.",
        // The patterns the AI grader looks for in the participant's explanation.
        patterns: [
          "The plain form of the noun ends in -s.",
          "'Of the' for one replaces -s with -a (ozols → ozola).",
          "'Of the' for several replaces -s with -u (autors → autoru)."
        ]
      }
    }
  },


  /* =======================================================
     UNIT 2 — Valley Yokuts (pre) · Swedish · Evenki · Irish (post)
     ======================================================= */
  2: {
    label: "Unit 2 · Morphology",
    next: null,

    // Same order for everyone: Valley Yokuts as pre-test, Irish as post-test.

    /* ---------- Post-test · Irish ---------- */
    post: {
      name: "Irish",
      heading: "Irish. Study the examples and solve the translation tasks.",
      // Source: Neacșu 4.1 (Kukhto, Elementy).
      flag: "🇮🇪",
      spotlight: "Irish (Gaeilge) is a Celtic language of the Indo-European family. It is the first official language of Ireland and is still spoken every day in the Gaeltacht regions.",
      panelTitle: "Irish · Command and present tense",
      chars: ["á", "é", "í", "ó", "ú"],
      examples: [
        ["fan", "Stay!"],
        ["fanaim", "I stay"],
        ["cuir", "Put!"],
        ["cuireann sé", "he puts"],
        ["ceannaigh", "Buy!"],
        ["ceannaíonn tú", "you buy"],
        ["creid", "Believe!"],
        ["creidim", "I believe"],
        ["déan", "Do!"],
        ["déanann sí", "she does"],
        ["ól", "Drink!"],
        ["lig", "Let!"],
        ["ligeann tú", "you let"],
        ["tosaigh", "Start!"],
        ["tosaím", "I start"]
      ],
      task: "These are Irish verbs in the command form and in the present tense. Look for recurring parts and try to infer what each part means.",
      apply: {
        title: "Apply: write in Irish (approx. 1 min)",
        items: [
          { label: "I put", key: ["cuirim"] },
          { label: "you (singular) stay", key: ["fanann tú", "fanann"] },
          { label: "he drinks", key: ["ólann sé", "ólann"] }
        ]
      },
      transfer: {
        title: "Transfer: write in Irish (approx. 1 min)",
        note: "Vocabulary: oibrigh = Work! · smaoinigh = Think!",
        items: [
          { label: "I work", key: ["oibrím"] },
          { label: "I think", key: ["smaoiním"] }
        ]
      },
      rule: {
        title: "Explain the rule: how is the Irish present tense built? (approx. 1 min)",
        placeholder: "Explain how the present-tense ending is formed...",
        answer: "The present tense is the command form (the stem) plus an ending. 'I' is a single word ending in " +
          "-(a)im with no pronoun; the other persons end in -(e)ann followed by the pronoun (sé = he, sí = she, " +
          "tú = you). The spelling of the ending depends on the last vowel of the stem: after a broad vowel " +
          "(a, o, u) it is -aim / -ann (fanaim, déanann, ólann); after a slender vowel (e, i) it is -im / -eann " +
          "(creidim, cuireann, ligeann). Stems ending in -igh drop the -igh and take -ím / -aíonn instead " +
          "(tosaigh → tosaím, ceannaigh → ceannaíonn).",
        // The patterns the AI grader looks for in the participant's explanation.
        patterns: [
          "'I' is one word ending in -(a)im with no pronoun; the other persons end in -(e)ann followed by the pronoun (sé, sí, tú).",
          "After a, o, u in the stem the ending is -aim / -ann; after e, i it is -im / -eann.",
          "Verbs ending in -igh drop the -igh and take -ím / -aíonn (tosaigh → tosaím, ceannaigh → ceannaíonn)."
        ]
      }
    },

    /* ---------- Pre-test · Valley Yokuts ---------- */
    pre: {
      name: "Valley Yokuts",
      heading: "Valley Yokuts. Study the examples and solve the translation tasks.",
      // Source: Neacșu 4.4 (Helmer, RoLO 2019), non-future forms only. ʔ is written as an apostrophe; k’ and ’ are consonants.
      letters: "Note: ’ and k’ are consonants.",
      flag: "🌄",
      spotlight: "Valley Yokuts is a Yokuts language of the San Joaquin Valley in California, historically spoken by Indigenous communities there.",
      panelTitle: "Valley Yokuts · Verb forms",
      columns: ["Stem", "Now or past", "Meaning"],
      chars: ["’"],
      examples: [
        [["dos", "doshin"], "report"],
        [["dub", "dubhun"], "conduct"],
        [["yawal", "yawalhin"], "follow"],
        [["logiw", "logiwhin"], "pulverise"],
        [["won", "wonhin"], "hide"],
        [["xat", "xathin"], "eat"],
        [["’ugun", "’ugunhun"], "drink"],
        [["’opot", "’opothin"], "get out of bed"]
      ],
      task: "Each row shows a verb stem and its form with the ending that means the action happens now or in the past. Look for recurring parts and try to infer what each part means.",
      apply: {
        title: "Apply: write the now-or-past form (approx. 1 min)",
        items: [
          { label: "lihim (run)", key: ["lihimhin"] },
          { label: "mek’ (swallow)", key: ["mek’hin"] },
          { label: "t’oyix (treat)", key: ["t’oyixhin"] }
        ]
      },
      transfer: {
        title: "Transfer: write the now-or-past form (approx. 1 min)",
        items: [
          { label: "’ilik (sing)", key: ["’ilikhin"] },
          { label: "luk’ul (bury)", key: ["luk’ulhun"] }
        ]
      },
      rule: {
        title: "Explain the rule: how is the Valley Yokuts now-or-past ending chosen? (approx. 1 min)",
        placeholder: "Explain how the ending is chosen...",
        answer: "The now-or-past form is the stem plus the ending -hin or -hun. The choice depends on the vowel of " +
          "the stem (vowel harmony): if the stem's vowel is u, the ending is -hun (dubhun, ’ugunhun); with any " +
          "other vowel (a, i, o) it is -hin (doshin, xathin, wonhin, ’opothin).",
        // The patterns the AI grader looks for in the participant's explanation.
        patterns: [
          "The ending is -hun when the stem's vowel is u, and -hin otherwise (a, i, o)."
        ]
      }
    },

    discover: {
      event: "swedish_discovery_and_worked_example_opened",
      heading: "Discover Swedish. What do you notice about the endings?",
      // Source: Neacșu 5.2 (Swedish, original).
      flag: "🇸🇪",
      spotlight: "Swedish is a North Germanic language and the official language of Sweden. It is also one of the two national languages of Finland.",
      panelTitle: "Swedish · Nouns",
      examples: [
        ["en flaska", "a bottle"],
        ["flaskan", "the bottle"],
        ["flaskor", "bottles"],
        ["flaskorna", "the bottles"],
        ["en stol", "a chair"],
        ["stolen", "the chair"],
        ["stolar", "chairs"],
        ["stolarna", "the chairs"]
      ],
      task: "Compare the nouns carefully. What do you notice about the endings?",
      placeholder: "Write what you notice about the endings...",
      lessonTitle: "Allomorphs: one ending, two shapes",
      lesson: `
        <p>Swedish has one way to say <em>the</em> and one way to say <em>more than one</em>, but each comes in two
          shapes. The bottle is <strong>flaskan</strong> and the chair is <strong>stolen</strong>:
          <strong>-n</strong> after a word that ends in a vowel, <strong>-en</strong> after a consonant. Bottles is
          <strong>flaskor</strong> and chairs is <strong>stolar</strong>: <strong>-or</strong> after a vowel (which
          drops), <strong>-ar</strong> after a consonant. The noun decides which shape it gets; the meaning is the
          same.</p>
        <p>Two shapes of one ending, chosen by the word they attach to, are called <strong>allomorphs</strong>. The
          plural <em>the</em> is <strong>-na</strong> on the plural: <strong>flaskorna</strong>,
          <strong>stolarna</strong>.</p>
        <p><strong>Try it:</strong> a girl is <strong>en flicka</strong>, so the girl is <strong>flickan</strong>,
          girls is <strong>flickor</strong>, the girls is <strong>flickorna</strong>. A bus is
          <strong>en buss</strong>, so the bus is <strong>bussen</strong>, buses is <strong>bussar</strong>.</p>`
    },

    practice: {
      prefix: "evenki",
      name: "Evenki",
      heading: "Evenki: complete the missing forms and discover the rule.",
      // Source: Neacșu 4.5 (Evenki, original), part (a). Letters: ʋ is written ü, ɵ is written ö, ə is written ë, ŋ is written ng; the colon marks a long vowel.
      letters: "The colon (:) marks a long vowel, e.g. xë:m.",
      flag: "🇷🇺 🇨🇳",
      spotlight: "Evenki is a Tungusic language spoken by small communities across Siberia and northern China. It builds words by adding endings to a stem.",
      panelTitle: "Evenki · Nouns in three forms",
      columns: ["One", "Many", "Towards one", "Meaning"],
      chars: ["ë", "ö", "ü"],
      strict: true,
      examples: [
        [["bitëg", "bitëgsël", "bitëglë"], "book"],
        [["udun", "udunsul", "______ (1)"], "rain"],
        [["igga", "iggasal", "iggala"], "flower"],
        [["nüxün", "nüxünsül", "nüxünlö"], "brother"],
        [["oron", "oronsol", "oronlo"], "place"],
        [["satan", "satansal", "satanla"], "candy"],
        [["iggë", "iggësël", "______ (2)"], "tail"],
        [["xë:m", "______ (3)", "xë:mlë"], "meal"]
      ],
      task: "Each row shows one noun in three forms: singular (bitëg = the book), plural (bitëgsël = the books) " +
        "and directional-locative singular (bitëglë = to the book). Fill in the three missing forms (1), (2) and (3), then work out the rule.",
      items: [
        { label: "(1) udun · udunsul · ______ (rain)", key: ["udunlo"] },
        { label: "(2) iggë · iggësël · ______ (tail)", key: ["iggëlë"] },
        { label: "(3) xë:m · ______ · xë:mlë (meal)", key: ["xë:msël"] }
      ],
      ruleTitle: "Explain the rule: how do the Evenki endings change?",
      // Shown to the participant after they click "Finish this activity".
      solution: `
        <p>Both endings change their vowel to match the <strong>last vowel of the noun</strong>.
          This is called <strong>vowel harmony</strong>.</p>
        <ul>
          <li><strong>Plural (-s_l)</strong> copies that vowel exactly:
            igga → iggasal, iggë → iggësël, oron → oronsol, udun → udunsul, nüxün → nüxünsül.</li>
          <li><strong>Towards one (-l_)</strong> uses a after a, ë after ë, o after o or u, ö after ö or ü:
            iggala, iggëlë, oronlo, udunlo, nüxünlö.</li>
        </ul>
        <p>So <strong>udun → udunlo</strong> (rain), <strong>iggë → iggëlë</strong> (tail) and
          <strong>xë:m → xë:msël</strong> (meal).</p>`,
      // For the AI tutor only (never shown): lets it check the learner's rule.
      ruleAnswer: "The plural adds -s_l and the directional-locative adds -l_; the vowel of each ending depends on " +
        "the last vowel of the stem (vowel harmony). The plural copies that vowel exactly: -sal after a, -sël after ë, " +
        "-sol after o, -sul after u, -sül after ü. The directional-locative uses -la after a, -lë after ë, " +
        "-lo after o or u, -lö after ö or ü.",
      rulePlaceholder: "Explain how the endings change...",
      greeting: "Hi! Let's explore your rule together. What have you noticed about the endings of the Evenki nouns?",
      hints: [
        "Look at the plural ending, the one with s and l. It is not always spelled the same. What is different?",
        "Compare the vowel inside the ending with the vowels of the stem.",
        "The ending copies the kind of vowel in the stem: a with a, ë with ë, o and u with o, ö and ü with ö."
      ]
    }
  }
};

/* =========================================================
   QUESTIONNAIRE — shown once, before the Unit 1 pre-test.
   Answers are saved with the rest of the data, including the email.
   ========================================================= */
const INTAKE = {
  heading: "Before you start",
  intro: "A few questions about you and languages. They take about two minutes.",
  // The languages that appear in the experiment
  knownLanguages: ["Dabida", "Zulu", "Swahili", "Latvian", "Valley Yokuts", "Swedish", "Evenki", "Irish"],
  consent: "This study looks at how people learn to analyse words in unfamiliar languages, with or without " +
    "an AI tutor. It takes about 40 minutes online. We record your answers, the rules you write and any chat " +
    "with the tutor. You can stop at any time without giving a reason. Your email is used only to contact you " +
    "about the study and is removed from the data before analysis."
};

// Lets the server (api/chat.js) read the same content; ignored in the browser.
if (typeof module !== "undefined" && module.exports) module.exports = UNITS;
