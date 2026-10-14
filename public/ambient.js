const tracks = [
  { title: "Mariana", src: new URL("./audio/mariana.m4a", import.meta.url).href },
  { title: "再谈记忆", src: new URL("./audio/zaitan-jiyi.m4a", import.meta.url).href },
  { title: "花に亡霊", src: new URL("./audio/hana-ni-bourei.m4a", import.meta.url).href },
];

export function setupAmbient() {
  const play = document.querySelector("#play");
  const status = document.querySelector("#audioStatus");
  const volume = document.querySelector("#volume");
  const volumeValue = document.querySelector("#volumeValue");
  const room = document.querySelector(".listening");
  const buttons = document.querySelectorAll("[data-track]");
  const prompt = document.querySelector("#audioPrompt");
  const audio = new Audio(tracks[0].src);
  audio.preload = "auto";
  audio.volume = Number(volume.value) / 100;
  let selected = 0;
  let autoplayBlocked = true;

  function updatePlaying() {
    const chinese = document.documentElement.lang === "zh-CN";
    const playing = !audio.paused;
    prompt.hidden = playing || !autoplayBlocked;
    prompt.textContent = chinese ? "▶ 点击开启音乐" : "▶ Click to play music";
    room.classList.toggle("playing", playing);
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute(
      "aria-label",
      chinese
        ? playing
          ? "暂停音乐"
          : "播放音乐"
        : playing
          ? "Pause music"
          : "Play music",
    );
    play.textContent = playing ? "Ⅱ" : "▶";
    status.textContent = `${chinese ? (playing ? "播放中" : "已暂停") : playing ? "PLAYING" : "PAUSED"} / ${tracks[selected].title}`;
    if (autoplayBlocked && !playing) {
      status.textContent = chinese
        ? "点击播放，开始聆听。"
        : "Click play to start listening.";
    }
  }

  function start() {
    status.textContent =
      document.documentElement.lang === "zh-CN" ? "正在加载音乐…" : "Loading music…";
    audio.play().catch((error) => {
      if (error.name === "AbortError") return;
      autoplayBlocked = error.name === "NotAllowedError";
      updatePlaying();
      if (autoplayBlocked) return;
      const chinese = document.documentElement.lang === "zh-CN";
      status.textContent = chinese
        ? "音频未能播放，请重试。"
        : "Audio could not play. Please try again.";
    });
  }

  function selectTrack(index) {
    const playing = !audio.paused;
    audio.pause();
    selected = index;
    audio.src = tracks[selected].src;
    document.querySelector("#soundTitle").textContent = tracks[selected].title;
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.track) === selected),
      ),
    );
    updatePlaying();
    if (playing) start();
  }

  audio.addEventListener("play", () => {
    autoplayBlocked = false;
    updatePlaying();
  });
  audio.addEventListener("pause", updatePlaying);
  audio.addEventListener("error", () => {
    const chinese = document.documentElement.lang === "zh-CN";
    audio.pause();
    updatePlaying();
    status.textContent = chinese
      ? "音频加载失败，请重试。"
      : "Audio could not load. Please try again.";
  });
  audio.addEventListener("ended", () => {
    selectTrack((selected + 1) % tracks.length);
    start();
  });
  play.onclick = () => (audio.paused ? start() : audio.pause());
  prompt.onclick = start;
  volume.oninput = () => {
    volumeValue.value = `${volume.value}%`;
    audio.volume = Number(volume.value) / 100;
  };
  buttons.forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.track);
      if (index !== selected) selectTrack(index);
    };
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
  });
  window.addEventListener("pagehide", () => audio.pause());
  document.addEventListener("studio:languagechange", updatePlaying);
  updatePlaying();
  if (!document.hidden) start();
  else {
    const startWhenVisible = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", startWhenVisible);
      start();
    };
    document.addEventListener("visibilitychange", startWhenVisible);
  }
}
