document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.ariaLabel = "Toggle theme";
  document.body.appendChild(themeToggle);

  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateHljsTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateHljsTheme(newTheme);
  });

  let keys = [];
  // prettier-ignore
  const konami = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let lainResourcesLoaded = false;

  function loadLainResources() {
    if (lainResourcesLoaded) {
      const takeover = document.getElementById("lain-takeover");
      if (takeover) takeover.style.display = "block";
      const audio = document.getElementById("lain-audio");
      if (audio) audio.play().catch((e) => console.error(e));
      return;
    }
    lainResourcesLoaded = true;
    console.log("PRESENT DAY, PRESENT TIME!");
    const lainCSS = document.createElement("link");
    lainCSS.rel = "stylesheet";
    lainCSS.href = "/static/lain.css";
    document.head.appendChild(lainCSS);
    const takeoverContainer = document.createElement("div");
    takeoverContainer.id = "lain-takeover";
    takeoverContainer.className = "lain-takeover";
    takeoverContainer.style.display = "none";
    takeoverContainer.innerHTML = `
      <div class="lain-text"></div>
      <div id="lain-images" class="lain-images"></div>
      <button id="lain-dismiss" class="lain-dismiss">✖</button>
    `;
    document.body.appendChild(takeoverContainer);
    const audioEl = document.createElement("audio");
    audioEl.id = "lain-audio";
    audioEl.loop = true;
    audioEl.src = "/static/audio/lain-takeover.mp3";
    document.body.appendChild(audioEl);
    const lainScript = document.createElement("script");
    lainScript.src = "/js/lain.js";
    document.body.appendChild(lainScript);
  }

  document.addEventListener("keydown", (e) => {
    keys = [...keys, e.key].slice(-10);
    if (keys.join("") === konami.join("")) {
      loadLainResources();
    }
  });
});

function updateHljsTheme(theme) {
  const lightThemeLink = document.getElementById("hljs-theme-light");
  const darkThemeLink = document.getElementById("hljs-theme-dark");

  if (lightThemeLink && darkThemeLink) {
    if (theme === "dark") {
      lightThemeLink.media = "not all";
      darkThemeLink.media = "all";
      darkThemeLink.disabled = false;
      lightThemeLink.disabled = true;
    } else {
      darkThemeLink.media = "not all";
      lightThemeLink.media = "all";
      lightThemeLink.disabled = false;
      darkThemeLink.disabled = true;
    }
  }
}
