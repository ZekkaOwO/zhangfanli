import { setupAmbient } from "./ambient.js";
const chinese = document.documentElement.lang === "zh-CN";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeTyping = new Set();
const acceleratedPanels = new WeakSet();
document.querySelectorAll(".terminal, .codeintro").forEach((panel) => {
  panel.addEventListener("click", () => acceleratedPanels.add(panel), true);
});

function typeText(element, speed = 55) {
  if (reducedMotion.matches) return;
  const panel = element.closest(".terminal, .codeintro");
  if (acceleratedPanels.has(panel)) speed = 10;

  // Keep the complete original available to assistive technology.
  const visual = element.cloneNode(true);
  visual.removeAttribute("id");
  visual.setAttribute("aria-hidden", "true");
  const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const characters = [];
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const character of Array.from(node.textContent)) {
      const span = document.createElement("span");
      span.className = "typing-character";
      span.textContent = character;
      fragment.append(span);
      characters.push(span);
    }
    node.replaceWith(fragment);
  }
  element.before(visual);
  element.classList.add("sr-only");
  let index = 0;
  let timer;
  const finish = () => {
    clearTimeout(timer);
    visual.remove();
    element.classList.remove("sr-only");
    panel?.removeEventListener("click", accelerate, true);
    activeTyping.delete(finish);
  };
  activeTyping.add(finish);
  const tick = () => {
    if (!visual.isConnected || reducedMotion.matches) return finish();
    if (index > 0) characters[index - 1].classList.remove("typing-cursor");
    if (index === characters.length) return finish();
    const character = characters[index++];
    character.classList.add("is-typed", "typing-cursor");
    const text = character.textContent;
    let delay = speed * (0.8 + Math.random() * 0.5);
    if (text === "\n") delay = speed * 5;
    else if (/[.!?;:,…]/u.test(text)) delay = speed * 3;
    timer = setTimeout(tick, delay);
  };
  const accelerate = () => {
    speed = 10;
    clearTimeout(timer);
    tick();
  };
  panel?.addEventListener("click", accelerate, true);
  tick();
}

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) [...activeTyping].forEach((finish) => finish());
});

typeText(document.querySelector(".welcome"));
typeText(document.querySelector(".codeintro code"));

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
    [...activeTyping].forEach((finish) => finish());
    output.replaceChildren();
    return;
  }
  const replies = chinese
    ? {
        help: "whoami · ls · photos · music · github · clear\n提示：使用 ↑ 和 ↓ 查看历史命令。",
        whoami: "Zhangfan Li / 软件工程师\n离开键盘之后：摄影与音乐。",
        ls: "about.pseudo\nphotography/\nmusic/",
        photos: "正在打开摄影区…",
        music: "正在打开音乐区…",
        "cd photography/": "正在打开摄影区…",
        "cd music/": "正在打开音乐区…",
        github: "github.com/zekkaowo — 点击名字旁的 GitHub 链接。",
      }
    : {
        help: "whoami · ls · photos · music · github · clear\nTip: ↑ and ↓ recall your commands.",
        whoami: "Zhangfan Li / Software engineer\nOff the keyboard: photography & music.",
        ls: "about.pseudo\nphotography/\nmusic/",
        photos: "Opening photography/ …",
        music: "Opening music/ …",
        "cd photography/": "Opening photography/ …",
        "cd music/": "Opening music/ …",
        github: "github.com/zekkaowo — use the GitHub link beside my name.",
      };
  const line = document.createElement("div");
  line.textContent = "❯ " + command;
  const reply = document.createElement("pre");
  reply.textContent =
    replies[command] ||
    (chinese ? "未知命令，请输入 help 查看帮助。" : "Unknown command. Try help.");
  output.append(line, reply);
  typeText(reply);
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

const cvDialog = document.querySelector("#cvDialog");
document.querySelector("#openCv").addEventListener("click", () => {
  cvDialog.showModal();
});
