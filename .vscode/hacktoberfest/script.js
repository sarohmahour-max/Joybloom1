import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;

const MODEL_NAME =
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english";

let sentimentModel = null;
let petalActivity = null;
let aiActivity = null;
let aiActivityCompleted = false;
let petalActivityCompleted = false;
let selectedMood = "";

const $ = (id) => document.getElementById(id);

const activities = {
    create: [
        {
            title: "Make a mini masterpiece 🎨",
            text: "Draw a tiny flower, design a sticker, or create a funny character on paper.",
            flower: "🎨",
            minutes: 10
        },
        {
            title: "Invent a new colour 🌈",
            text: "Imagine a colour that doesn't exist yet. Give it a name and draw it.",
            flower: "🌈",
            minutes: 5
        },
        {
            title: "Make a paper creation ✂️",
            text: "Fold a paper heart, make a bookmark, or decorate a small note.",
            flower: "💗",
            minutes: 10
        }
    ],

    discover: [
        {
            title: "Become a tiny explorer 🔎",
            text: "Learn one surprising fact about an animal, planet, artist, or place.",
            flower: "🔎",
            minutes: 10
        },
        {
            title: "Learn one new word 📚",
            text: "Find a new word, understand its meaning, and use it in a sentence.",
            flower: "📚",
            minutes: 5
        },
        {
            title: "Explore another world 🪐",
            text: "Imagine visiting another planet. What would you see there?",
            flower: "🪐",
            minutes: 10
        }
    ],

    connect: [
        {
            title: "Send a sunshine message 💌",
            text: "Send someone a genuine thank-you or tell them something you appreciate.",
            flower: "💌",
            minutes: 5
        },
        {
            title: "Spread a little kindness 💗",
            text: "Think of one small way to make somebody's day better.",
            flower: "💗",
            minutes: 5
        },
        {
            title: "Reconnect with someone ☎️",
            text: "Ask a friend or family member how their day is going.",
            flower: "🌷",
            minutes: 10
        }
    ],

    recharge: [
        {
            title: "Take a tiny screen break 🍃",
            text: "Put your device aside, stretch gently, and notice what's around you.",
            flower: "🍃",
            minutes: 5
        },
        {
            title: "Enjoy a quiet moment ☁️",
            text: "Get comfortable, relax your shoulders, and take a few gentle breaths.",
            flower: "☁️",
            minutes: 5
        },
        {
            title: "Notice little things 🌼",
            text: "Look outside and notice three details you hadn't paid attention to.",
            flower: "🌼",
            minutes: 5
        }
    ]
};

const quickIdeas = [
    "Doodle a tiny flower on paper. 🌼",
    "Stretch gently and take a screen break. 🍃",
    "Notice three little details around you. ☀️",
    "Listen to one favourite song. 🎵",
    "Invent a name for an imaginary planet. 🪐",
    "Draw your dream garden in one minute. 🌷",
    "Write down one thing you want to learn. 📚",
    "Send someone a kind message. 💌",
    "Make up a silly new word. ✨"
];

const kindnessIdeas = [
    "Thank someone for something small they did. 💗",
    "Give a friend a genuine compliment. 🌷",
    "Ask someone how their day is going. ☀️",
    "Share something interesting you learned. 🌱",
    "Help with a small task at home. 🪴",
    "Leave an encouraging note for someone. 💌",
    "Listen carefully when someone wants to talk. 🦋"
];

const dailyQuests = [
    "Make something with your hands, even if it's a tiny doodle. 🎨",
    "Learn one new fact about something you love. 🔎",
    "Give someone a genuine compliment. 💗",
    "Take five minutes away from your screen. 🍃",
    "Write three sentences about an imaginary world. 🪐",
    "Notice five beautiful little details around you. 🌼",
    "Listen to a song and enjoy the moment. 🎵",
    "Create a tiny paper decoration. ✂️",
    "Share something kind with somebody today. 💌"
];

// MOOD-TO-BLOOM
const moodMessages = {
    happy: "Let's use that happy energy for something creative or curious! ☀️",
    sad: "Let's keep it gentle. Choose one small, comforting activity. 🌧️",
    stressed: "No pressure. A calm, simple activity is a good place to start. 🍃",
    tired: "Let's pick something short and low-effort. 💤",
    calm: "A peaceful moment is perfect for a little creativity or discovery. 🌿"
};

const moodCategories = {
    happy: ["create", "discover"],
    sad: ["recharge", "connect"],
    stressed: ["recharge", "create"],
    tired: ["recharge", "connect"],
    calm: ["create", "discover", "recharge"]
};

// SAFE BROWSER STORAGE
function loadArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function saveArray(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

let collectedFlowers = loadArray("joyBloomFlowers");
let savedIdeas = loadArray("joyBloomJar");

// RANDOM ACTIVITY
function pickRandom(items, previous = null) {
    if (!items.length) return null;

    if (items.length > 1 && previous) {
        const alternatives = items.filter(
            (item) => item !== previous
        );

        if (alternatives.length) {
            items = alternatives;
        }
    }

    return items[Math.floor(Math.random() * items.length)];
}

// COLLECT A FLOWER
function collectFlower(flower) {
    collectedFlowers.push(flower);
    saveArray("joyBloomFlowers", collectedFlowers);
    renderGarden();
}

// DISPLAY THE GARDEN
function renderGarden() {
    const count = $("flower-count");
    const garden = $("my-flowers");

    if (!count || !garden) return;

    count.textContent = collectedFlowers.length;
    garden.replaceChildren();

    if (collectedFlowers.length === 0) {
        const empty = document.createElement("p");
        empty.id = "empty-garden";
        empty.textContent =
            "Your garden is waiting to bloom. 🌱";

        garden.appendChild(empty);
        return;
    }

    collectedFlowers.forEach((flower) => {
        const item = document.createElement("span");
        item.className = "collected-flower";
        item.textContent = flower;
        item.title = "A little joy you completed!";

        garden.appendChild(item);
    });
}

// PICK A PETAL
document.querySelectorAll("[data-petal]").forEach((card) => {
    card.addEventListener("click", () => {
        const category = card.dataset.petal;
        const categoryActivities = activities[category];

        if (!categoryActivities) return;

        const activity = pickRandom(
            categoryActivities,
            petalActivity
        );

        petalActivity = {
            ...activity,
            category
        };

        petalActivityCompleted = false;

        $("petal-title").textContent = activity.title;
        $("petal-description").textContent = activity.text;
        $("petal-time").textContent =
            `⏰ About ${activity.minutes} minutes`;

        $("petal-status").textContent = "";
        $("petal-complete").disabled = false;
        $("petal-complete").textContent =
            "I did it! Collect a flower 🌷";

        $("petal-result").hidden = false;

        $("petal-result").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
});

// COMPLETE A PETAL ACTIVITY
$("petal-complete").addEventListener("click", () => {
    if (!petalActivity || petalActivityCompleted) return;

    collectFlower(petalActivity.flower);
    petalActivityCompleted = true;

    $("petal-complete").disabled = true;
    $("petal-complete").textContent =
        "Flower collected! 🌸";

    $("petal-status").textContent =
        "You did it! Your little garden has grown. 🌱";
});

// MOOD SELECTOR
document.querySelectorAll(".mood-option").forEach((button) => {
    button.addEventListener("click", () => {
        selectedMood = button.dataset.mood || "";

        document.querySelectorAll(".mood-option").forEach((option) => {
            const selected = option === button;

            option.classList.toggle("selected", selected);
            option.setAttribute(
                "aria-pressed",
                String(selected)
            );
        });

        const feedback = $("mood-feedback");

        if (feedback) {
            feedback.textContent =
                moodMessages[selectedMood] ||
                "Mood selected! Your activity will be personalized. 💗";
        }
    });
});

// LOAD THE AI MODEL
async function getSentiment(text) {
    if (!sentimentModel) {
        $("ai-status").textContent =
            "Loading the AI gardener for the first time... 🌱";

        sentimentModel = await pipeline(
            "text-classification",
            MODEL_NAME,
            { dtype: "q8" }
        );
    }

    const prediction = await sentimentModel(text);

    return prediction[0].label.toUpperCase();
}

// CHOOSE ACTIVITY USING MOOD, ENERGY, TIME AND SENTIMENT
function chooseActivity(sentiment, energy, minutes, mood) {
    let choices = Object.entries(activities)
        .filter(([category]) =>
            !mood || moodCategories[mood]?.includes(category)
        )
        .flatMap(([, items]) => items)
        .filter((activity) => activity.minutes <= minutes);

    if (energy === "low") {
        const lowEnergyTitles = [
            "Take a tiny screen break 🍃",
            "Enjoy a quiet moment ☁️",
            "Notice little things 🌼",
            "Send a sunshine message 💌",
            "Spread a little kindness 💗",
            "Invent a new colour 🌈",
            "Learn one new word 📚"
        ];

        const lowEnergyChoices = choices.filter((activity) =>
            lowEnergyTitles.includes(activity.title)
        );

        if (lowEnergyChoices.length) {
            choices = lowEnergyChoices;
        }
    }

    if (energy === "high") {
        const energeticChoices = choices.filter((activity) =>
            [
                "Make a mini masterpiece 🎨",
                "Invent a new colour 🌈",
                "Make a paper creation ✂️",
                "Become a tiny explorer 🔎",
                "Explore another world 🪐"
            ].includes(activity.title)
        );

        if (energeticChoices.length) {
            choices = energeticChoices;
        }
    }

    if (sentiment === "NEGATIVE" && !mood) {
        const gentleTitles = [
            "Take a tiny screen break 🍃",
            "Enjoy a quiet moment ☁️",
            "Send a sunshine message 💌",
            "Spread a little kindness 💗",
            "Notice little things 🌼"
        ];

        const gentleChoices = choices.filter((activity) =>
            gentleTitles.includes(activity.title)
        );

        if (gentleChoices.length) {
            choices = gentleChoices;
        }
    }

    // Fallback when the filters leave no activities.
    if (!choices.length) {
        choices = Object.values(activities)
            .flat()
            .filter((activity) => activity.minutes <= minutes);
    }

    if (!choices.length) {
        choices = Object.values(activities).flat();
    }

    return pickRandom(choices, aiActivity);
}

// AI BLOOM FINDER
$("suggest-button").addEventListener("click", async () => {
    const note = $("mood").value.trim();
    const energy = $("energy").value;
    const minutes = Number($("time").value);

    if (!note) {
        $("ai-status").textContent =
            "Write a little about your day first. 🌷";

        $("mood").focus();
        return;
    }

    const button = $("suggest-button");

    button.disabled = true;
    $("complete-button").disabled = true;
    $("result").hidden = true;

    try {
        $("ai-status").textContent =
            "Your AI gardener is thinking... 🌱";

        const sentiment = await getSentiment(note);

        aiActivity = chooseActivity(
            sentiment,
            energy,
            minutes,
            selectedMood
        );

        aiActivityCompleted = false;

        $("result-flower").textContent = aiActivity.flower;
        $("result-title").textContent = aiActivity.title;
        $("result-text").textContent = aiActivity.text;

        let detail =
            sentiment === "NEGATIVE"
                ? "The model detected a more negative tone. Here's a gentle activity you could try. AI can misunderstand your words."
                : "The model detected a more positive tone. Here's an activity chosen using your time and energy preferences.";

        if (selectedMood && moodMessages[selectedMood]) {
            detail += ` Mood-to-Bloom: ${moodMessages[selectedMood]}`;
        }

        $("result-detail").textContent = detail;
        $("result").hidden = false;

        $("complete-button").disabled = false;
        $("complete-button").textContent = "I did it! 🌱";

        $("ai-status").textContent =
            "Your little activity is ready! 🌼";

    } catch (error) {
        console.error("AI model error:", error);

        $("ai-status").textContent =
            "The AI couldn't load. Check your internet connection and try again.";

    } finally {
        button.disabled = false;
    }
});

// COMPLETE THE AI ACTIVITY
$("complete-button").addEventListener("click", () => {
    if (!aiActivity || aiActivityCompleted) return;

    collectFlower(aiActivity.flower);
    aiActivityCompleted = true;

    $("complete-button").disabled = true;
    $("complete-button").textContent =
        "Flower collected! 🌸";

    $("ai-status").textContent =
        "Lovely! Your garden has grown by one flower. 🌷";
});

// RESET THE GARDEN
$("reset-garden").addEventListener("click", () => {
    const confirmed = confirm(
        "Start a fresh garden? This clears your collected flowers."
    );

    if (!confirmed) return;

    collectedFlowers = [];

    saveArray("joyBloomFlowers", collectedFlowers);
    renderGarden();

    $("petal-complete").disabled = true;
    $("complete-button").disabled = true;

    petalActivityCompleted = false;
    aiActivityCompleted = false;

    $("petal-status").textContent = "";
    $("ai-status").textContent =
        "A fresh little garden, just for you. 🌱";
});

// FIVE-MINUTE JOY
let previousQuickIdea = "";

$("quick-button").addEventListener("click", () => {
    previousQuickIdea = pickRandom(
        quickIdeas,
        previousQuickIdea
    );

    $("quick-result").textContent = previousQuickIdea;
});

// KINDNESS CORNER
let previousKindness = "";

$("kindness-button").addEventListener("click", () => {
    previousKindness = pickRandom(
        kindnessIdeas,
        previousKindness
    );

    $("kindness-prompt").textContent = previousKindness;
});

// DAILY JOY QUEST
let previousQuest = "";

$("new-quest").addEventListener("click", () => {
    previousQuest = pickRandom(
        dailyQuests,
        previousQuest
    );

    $("quest-text").textContent = previousQuest;
});

// JOY JAR
function renderJar() {
    const container = $("jar-items");

    if (!container) return;

    container.replaceChildren();

    if (savedIdeas.length === 0) {
        const empty = document.createElement("p");

        empty.id = "empty-jar";
        empty.textContent =
            "Your jar is waiting for its first little idea. 🌷";

        container.appendChild(empty);
        return;
    }

    savedIdeas.forEach((idea, index) => {
        const row = document.createElement("div");
        row.className = "jar-item";

        const text = document.createElement("span");
        text.textContent = `💗 ${idea}`;

        const removeButton = document.createElement("button");

        removeButton.className = "remove-jar";
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.setAttribute(
            "aria-label",
            `Remove saved idea ${index + 1}`
        );

        removeButton.addEventListener("click", () => {
            savedIdeas.splice(index, 1);

            saveArray("joyBloomJar", savedIdeas);
            renderJar();
        });

        row.append(text, removeButton);
        container.appendChild(row);
    });
}

$("save-jar").addEventListener("click", () => {
    const note = $("jar-note").value.trim();

    if (!note) {
        $("jar-status").textContent =
            "Write a little idea before saving it. 🌷";

        $("jar-note").focus();
        return;
    }

    if (savedIdeas.length >= 50) {
        $("jar-status").textContent =
            "Your jar is full! Remove an idea before adding another.";

        return;
    }

    savedIdeas.push(note);
    saveArray("joyBloomJar", savedIdeas);

    $("jar-note").value = "";

    $("jar-status").textContent =
        "A little idea saved! 💌";

    renderJar();
});

$("jar-note").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        $("save-jar").click();
    }
});

// START THE GARDEN
renderGarden();
renderJar();
