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

  // Lain Takeover Easter Egg
  const lainQuotes = [
    "I don’t seem to understaaannnddd...",
    "Present day, present time!",
    "Let’s all love Lain!",
    "The Wired is watching...",
  ];
  let keys = [];
  const konami = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let imageIndex = 1;
  let failedFetches = 0;
  const maxImages = 15;
  let imageElements = [];

  async function tryFetchImage(index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = `/static/images/lain/lain-${index}.png`;
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
    });
  }

  async function loadImages(takeover, imagesContainer) {
    while (failedFetches < 3 && imageIndex <= 100) {
      try {
        await tryFetchImage(imageIndex);
        failedFetches = 0;
        if (imageElements.length < maxImages) {
          const imgDiv = document.createElement("div");
          imgDiv.className = "lain-image lain-image-noise";
          imgDiv.style.backgroundImage = `url("/static/images/lain/lain-${imageIndex}.png")`;
          imgDiv.style.top = `${Math.random() * 80}%`;
          imgDiv.style.left = `${Math.random() * 80}%`;
          imgDiv.style.animation = `advancedGlitch ${0.5 + Math.random() * 1}s infinite linear, move ${8 + Math.random() * 4}s linear infinite, fadeIn 0.5s forwards`;
          imagesContainer.appendChild(imgDiv);
          imageElements.push(imgDiv);
        } else {
          const replaceIndex = Math.floor(Math.random() * imageElements.length);
          imageElements[replaceIndex].style.backgroundImage =
            `url("/static/images/lain/lain-${imageIndex}.png")`;
          imageElements[replaceIndex].style.top = `${Math.random() * 80}%`;
          imageElements[replaceIndex].style.left = `${Math.random() * 80}%`;
          imageElements[replaceIndex].style.animation =
            `advancedGlitch ${0.5 + Math.random() * 1}s infinite linear, move ${8 + Math.random() * 4}s linear infinite`;
        }
        imageIndex++;
      } catch (error) {
        failedFetches++;
        imageIndex++;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  document.addEventListener("keydown", async (e) => {
    keys = [...keys, e.key].slice(-10);
    if (keys.join("") === konami.join("")) {
      const takeover = document.getElementById("lain-takeover");
      const audio = document.getElementById("lain-audio");
      const lainText = document.querySelector(".lain-text");
      const imagesContainer = document.getElementById("lain-images");
      if (takeover && audio && imagesContainer) {
        takeover.style.display = "block";
        document.body.click(); // oh the user clicked
        audio
          .play()
          .catch((err) => console.error("Audio playback failed:", err));
        if (lainText) {
          lainText.textContent =
            lainQuotes[Math.floor(Math.random() * lainQuotes.length)];
        }
        imageIndex = 1;
        failedFetches = 0;
        imageElements = [];
        imagesContainer.innerHTML = "";
        await loadImages(takeover, imagesContainer);
      }
    }
  });

  const dismissButton = document.getElementById("lain-dismiss");
  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      const takeover = document.getElementById("lain-takeover");
      const audio = document.getElementById("lain-audio");
      if (takeover && audio) {
        takeover.style.display = "none";
        audio.pause();
        audio.currentTime = 0;
        imageElements = [];
      }
    });
  }
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
