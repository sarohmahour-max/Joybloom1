const globe = document.querySelector("#globe");
const button = document.querySelector("#shake");
const message = document.querySelector("#message");

const messages = [
  "you are someone's favourite person to sit next to.",
  "the thing you are building counts, even half finished.",
  "you are allowed to be a beginner for as long as you need.",
  "someone is going to love what you make with this.",
  "hot chocolate tastes better after a hard day. you've earned one.",
  "you ask good questions. that is the whole skill.",
];

button.addEventListener("click", () => {
  globe.classList.add("shaking");
  setTimeout(() => globe.classList.remove("shaking"), 600);
});

  const randomIndex = Math.floor(Math.random() * messages.length);
  message.textContent = messages[randomIndex];