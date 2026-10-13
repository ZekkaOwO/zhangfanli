(() => {
  const canvas = document.querySelector("#weather-canvas"),
    ctx = canvas.getContext("2d");
  const modes = ["sun", "rain", "snow", "fog"];
  let dark = document.documentElement.dataset.theme === "dark";
  let w = 0,
    h = 0,
    sizeScale = 1,
    rainCount = 200,
    snowCount = 150,
    ambientCount = 95,
    mode = modes[Math.floor(Math.random() * modes.length)],
    paused = matchMedia("(prefers-reduced-motion: reduce)").matches,
    particles = [],
    last = 0,
    time = 0,
    frame = 0;
  function resize() {
    w = innerWidth;
    h = innerHeight;
    const areaRatio = (w * h) / (1920 * 1080);
    sizeScale = Math.min(2, Math.max(0.75, Math.sqrt(areaRatio)));
    const density = Math.min(4, Math.max(0.35, areaRatio));
    rainCount = Math.round(200 * density);
    snowCount = Math.round(150 * density);
    ambientCount = Math.round(95 * density);
    const dpr = Math.min(devicePixelRatio || 1, 2, 3840 / w, 2160 / h);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(0);
  }
  function seed() {
    particles = Array.from(
      { length: Math.max(rainCount, snowCount, ambientCount) },
      () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random(),
        phase: Math.random() * Math.PI * 2,
      }),
    );
  }
  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    time += dt;
    const count =
      mode === "rain" ? rainCount : mode === "snow" ? snowCount : ambientCount;
    if (mode === "rain") {
      ctx.strokeStyle = "#c4d6cd";
      ctx.lineWidth = 1.75 * sizeScale;
      for (let i = 0; i < count; i++) {
        const p = particles[i],
          speed = 330 + p.s * 280,
          length = (18 + p.s * 16) * sizeScale;
        p.y += dt * speed;
        p.x -= dt * speed * 0.18;
        if (p.y > h + length) {
          p.y = -length;
          p.x = Math.random() * (w + 80);
        }
        if (p.x < -30) p.x = w + 30;
        ctx.globalAlpha = 0.12 + p.s * 0.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (4 + p.s * 4) * sizeScale, p.y + length);
        ctx.stroke();
      }
    }
    if (mode === "snow") {
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.y += dt * (18 + p.s * 34);
        p.x += Math.sin(time * 0.6 + p.phase) * dt * 12;
        if (p.y > h + 8 * sizeScale) {
          p.y = -8 * sizeScale;
          p.x = Math.random() * w;
        }
        ctx.globalAlpha = 0.25 + p.s * 0.3;
        ctx.fillStyle = p.s > 0.5 ? "#ffffff" : "#d3e5dc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, (2.6 + p.s * 4.5) * sizeScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (mode === "sun") {
      const sunRadius = Math.min(w * 0.5, 360 * sizeScale);
      const sunX = w * 0.2 + Math.sin(time * 0.24) * 75 * sizeScale;
      const sunY = h * 0.18;
      const sunlight = ctx.createRadialGradient(
        sunX,
        sunY,
        sunRadius * 0.12,
        sunX,
        sunY,
        sunRadius,
      );
      const lightColor = dark ? "170,197,232" : "216,172,88";
      sunlight.addColorStop(0, `rgba(${lightColor},${dark ? 0.16 : 0.2})`);
      sunlight.addColorStop(1, `rgba(${lightColor},0)`);
      ctx.fillStyle = sunlight;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w * 0.06 + Math.sin(time * 0.24) * 75 * sizeScale, -60);
      ctx.rotate(Math.sin(time * 0.16) * 0.11);
      for (let i = 0; i < 5; i++) {
        const x = i * w * 0.16;
        const grad = ctx.createLinearGradient(x, 0, x + w * 0.18, h);
        grad.addColorStop(0, `rgba(${lightColor},${dark ? 0.14 : 0.28})`);
        grad.addColorStop(1, `rgba(${lightColor},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 45 * sizeScale, 0);
        ctx.lineTo(x + w * 0.5, h);
        ctx.lineTo(x + w * 0.28, h);
        ctx.fill();
      }
      ctx.restore();
      for (let i = 0; i < count / 2; i++) {
        const p = particles[i];
        p.y -= dt * (5 + p.s * 10);
        p.x += Math.sin(time * 0.5 + p.phase) * dt * 7;
        if (p.y < 0) p.y = h;
        ctx.globalAlpha = 0.12 + Math.sin(time + p.phase) * 0.08;
        ctx.fillStyle = dark ? "#bacfeb" : "#b59652";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (mode === "fog") {
      for (let i = 0; i < 6; i++) {
        const x = (i % 2 ? w * 0.85 : w * 0.1) + Math.sin(time * 0.12 + i) * w * 0.2,
          y = h * (i / 5) + Math.cos(time * 0.1 + i) * 45,
          r = Math.max(w * 0.32, 220);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(149,170,149,0.24)");
        grad.addColorStop(1, "rgba(149,170,149,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }
    ctx.globalAlpha = 1;
  }
  function loop(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    draw(dt);
    frame = requestAnimationFrame(loop);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (!paused && !document.hidden) frame = requestAnimationFrame(loop);
  }
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", sync);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (event) => {
    paused = event.matches;
    sync();
  });
  const trigger = document.querySelector("#weatherTrigger");
  const panel = document.querySelector("#weatherPanel");
  const controls = document.querySelector(".weather-control");
  const options = [...document.querySelectorAll("[data-weather-mode]")];
  const sunButton = options.find((button) => button.dataset.weatherMode === "sun");
  const sunIcon = sunButton.querySelector("svg").cloneNode(true);
  const moonIcon = document.querySelector(".theme-moon svg").cloneNode(true);
  function syncWeatherControl() {
    sunButton.querySelector("[data-weather-label]").textContent = dark
      ? "Moonlit"
      : "Sunny";
    sunButton
      .querySelector("svg")
      .replaceWith((dark ? moonIcon : sunIcon).cloneNode(true));
    options.forEach((button) => {
      const selected = button.dataset.weatherMode === mode;
      button.setAttribute("aria-pressed", String(selected));
      if (selected) {
        trigger
          .querySelector("svg")
          .replaceWith(button.querySelector("svg").cloneNode(true));
        trigger.title = `Current weather: ${button.querySelector("span").textContent.trim()}`;
      }
    });
  }
  function setWeather(nextMode) {
    if (!modes.includes(nextMode)) return;
    mode = nextMode;
    document.body.dataset.weather = mode;
    syncWeatherControl();
    seed();
    draw(0);
  }
  function closePanel(restoreFocus = false) {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  }
  trigger.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) options.find((button) => button.dataset.weatherMode === mode)?.focus();
  });
  document
    .querySelector("#weatherClose")
    .addEventListener("click", () => closePanel(true));
  options.forEach((button) =>
    button.addEventListener("click", () => {
      setWeather(button.dataset.weatherMode);
      closePanel(true);
    }),
  );
  document.addEventListener("pointerdown", (event) => {
    if (!controls.contains(event.target)) closePanel();
  });
  controls.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      closePanel(true);
    }
  });
  controls.addEventListener("focusout", (event) => {
    if (!controls.contains(event.relatedTarget)) closePanel();
  });
  document.body.dataset.weather = mode;
  new MutationObserver(() => {
    dark = document.documentElement.dataset.theme === "dark";
    syncWeatherControl();
    draw(0);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  syncWeatherControl();
  resize();
  sync();
})();
