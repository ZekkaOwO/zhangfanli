import { setupAmbient } from "./ambient.js";

const output = document.querySelector("#output"),
  input = document.querySelector("#command");
const history = [];
let historyIndex = 0;
function run(raw) {
  const command = raw.trim().replace(/\s+/g, " ");
  if (!command) return;
  history.push(command);
  historyIndex = history.length;
  input.value = "";
  if (command === "clear") {
    output.replaceChildren();
    return;
  }
  const replies = {
    help: "whoami · ls · photos · music · github · clear\nTip: ↑ and ↓ recall your commands.",
    whoami: "Fanli / Software engineer\nOff the keyboard: photography & music.",
    ls: "about.pseudo\nphotography/\nmusic/",
    photos: "Opening photography/ …",
    music: "Opening music/ …",
    "cd photography/": "Opening photography/ …",
    "cd music/": "Opening music/ …",
    github: "github.com/zekkaowo — use the GitHub link below.",
  };
  const line = document.createElement("div");
  line.textContent = "❯ " + command;
  const reply = document.createElement("pre");
  reply.textContent = replies[command] || "Unknown command. Try help.";
  output.append(line, reply);
  while (output.children.length > 20) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
  if (["photos", "cd photography/", "music", "cd music/"].includes(command))
    document
      .querySelector(command.includes("music") ? "#music" : "#photography")
      .scrollIntoView();
}
document.querySelector("#terminalForm").onsubmit = (e) => {
  e.preventDefault();
  run(input.value);
};
document
  .querySelectorAll("[data-command]")
  .forEach((b) => (b.onclick = () => run(b.dataset.command)));
input.onkeydown = (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    historyIndex = Math.max(
      0,
      Math.min(history.length, historyIndex + (e.key === "ArrowUp" ? -1 : 1)),
    );
    input.value = history[historyIndex] || "";
  }
};

setupAmbient();
