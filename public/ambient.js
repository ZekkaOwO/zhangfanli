// Replace this synthesizer with recorded tracks when personal music is ready.
const studies = [
  {
    title: "A softer tempo.",
    name: "STILL",
    roots: [48, 53, 45, 55],
    steps: [0, 4, 7, 11],
    beat: 2.4,
  },
  {
    title: "Warm afternoon.",
    name: "WARM",
    roots: [50, 55, 48, 53],
    steps: [0, 3, 7, 10],
    beat: 2,
  },
  {
    title: "An open window.",
    name: "OPEN",
    roots: [45, 48, 53, 55],
    steps: [0, 7, 12, 16],
    beat: 2.8,
  },
];
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
const chinese = document.documentElement.lang === "zh-CN";
const chineseTitles = ["轻柔的节奏。", "温暖的午后。", "敞开的窗。"];
const chineseMoods = ["宁静", "温暖", "开阔"];

export function setupAmbient() {
  const play = document.querySelector("#play");
  const status = document.querySelector("#audioStatus");
  const volume = document.querySelector("#volume");
  const volumeValue = document.querySelector("#volumeValue");
  const room = document.querySelector(".listening");
  let context,
    session,
    timer,
    mood = 0,
    starting = false;

  function updatePlaying(playing) {
    room.classList.toggle("playing", playing);
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute(
      "aria-label",
      chinese
        ? playing
          ? "暂停氛围音乐"
          : "播放氛围音乐"
        : playing
          ? "Pause ambient music"
          : "Play ambient music",
    );
    play.textContent = playing ? "Ⅱ" : "▷";
    status.textContent = chinese
      ? playing
        ? `播放中 / ${chineseMoods[mood]}`
        : "已暂停 / 氛围音乐"
      : playing
        ? `PLAYING / ${studies[mood].name}`
        : "PAUSED / AMBIENT STUDY";
  }

  function voice(current, midi, time, duration, level, pad = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + (pad ? 1.5 : 0.025));
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(current.filter);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.1);
    current.voices.add(oscillator);
    oscillator.onended = () => {
      current.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  function schedule() {
    if (!session) return;
    const current = session;
    const study = studies[mood];
    while (current.next < context.currentTime + 0.25) {
      const position = current.step % 4;
      const root = study.roots[Math.floor(current.step / 4) % study.roots.length];
      if (position === 0) {
        study.steps.forEach((step) =>
          voice(current, root + step, current.next, study.beat * 4 + 1, 0.035, true),
        );
      }
      // A repeatable, sparse melody rather than random notes.
      const pattern = [2, 1, 3, 0, 1, 3, 2, 1];
      const note = root + study.steps[pattern[current.step % pattern.length]] + 12;
      voice(current, note, current.next + 0.15, 3.5, 0.075);
      voice(current, note + 12, current.next + 0.15, 1.5, 0.012);
      current.next += study.beat;
      current.step++;
    }
  }

  function stop() {
    if (!session) return;
    clearInterval(timer);
    const previous = session;
    session = undefined;
    previous.master.gain.cancelScheduledValues(context.currentTime);
    previous.master.gain.setTargetAtTime(0, context.currentTime, 0.08);
    previous.voices.forEach((oscillator) => oscillator.stop(context.currentTime + 0.4));
    setTimeout(() => previous.nodes.forEach((node) => node.disconnect()), 600);
    updatePlaying(false);
  }

  async function start() {
    if (starting || session) return;
    starting = true;
    play.disabled = true;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("Audio is unavailable");
      context ||= new Audio();
      await context.resume();
      if (document.hidden) return;
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      const delay = context.createDelay(2);
      const feedback = context.createGain();
      const wet = context.createGain();
      filter.type = "lowpass";
      filter.frequency.value = 2200;
      delay.delayTime.value = 0.65;
      feedback.gain.value = 0.28;
      wet.gain.value = 0.22;
      filter.connect(master);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(master);
      master.connect(context.destination);
      master.gain.value = 0;
      master.gain.setTargetAtTime(Number(volume.value) / 100, context.currentTime, 0.3);
      session = {
        master,
        filter,
        voices: new Set(),
        nodes: [master, filter, delay, feedback, wet],
        next: context.currentTime + 0.1,
        step: 0,
      };
      schedule();
      timer = setInterval(schedule, 100);
      updatePlaying(true);
    } catch {
      stop();
      status.textContent = chinese
        ? "音频未能启动，请重试。"
        : "Audio could not start. Please try again.";
    } finally {
      starting = false;
      play.disabled = false;
    }
  }

  play.onclick = () => (session ? stop() : start());
  volume.oninput = () => {
    volumeValue.value = `${volume.value}%`;
    session?.master.gain.setTargetAtTime(
      Number(volume.value) / 100,
      context.currentTime,
      0.1,
    );
  };
  document.querySelectorAll("[data-mood]").forEach((button) => {
    button.onclick = () => {
      mood = Number(button.dataset.mood);
      document
        .querySelectorAll("[data-mood]")
        .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelector("#soundTitle").textContent = chinese
        ? chineseTitles[mood]
        : studies[mood].title;
      if (session) {
        stop();
        start();
      }
    };
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  window.addEventListener("pagehide", stop);
}
