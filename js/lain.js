(function () {
  const takeover = document.getElementById("lain-takeover");
  const audio = document.getElementById("lain-audio");
  const lainText = document.querySelector(".lain-text");
  const imagesContainer = document.getElementById("lain-images");
  const dismissButton = document.getElementById("lain-dismiss");

  const lainQuotes = [
    "I don’t seem to understaaannnddd...",
    "Present day, present time!",
    "Let’s all love Lain!",
    "The Wired is watching...",
  ];

  let imageIndex = 1;
  let failedFetches = 0;
  const maxImages = 15;
  let imageElements = [];
  let imageLoadingInterval;

  async function tryFetchImage(index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = `/static/images/lain/lain-${index}.png`;
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
    });
  }

  async function loadNextImage() {
    if (failedFetches >= 3 || imageIndex > 100) {
      if (imageLoadingInterval) {
        clearInterval(imageLoadingInterval);
      }
      return;
    }

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
    } catch (error) {
      failedFetches++;
    }
    imageIndex++;
  }

  function activate() {
    if (takeover && audio && imagesContainer && lainText) {
      takeover.style.display = "block";
      audio.play().catch((err) => console.error("Audio playback failed:", err));
      lainText.textContent =
        lainQuotes[Math.floor(Math.random() * lainQuotes.length)];

      imageIndex = 1;
      failedFetches = 0;
      imageElements = [];
      imagesContainer.innerHTML = "";
      imageLoadingInterval = setInterval(loadNextImage, 200);
    }
  }

  function dismiss() {
    if (takeover && audio) {
      takeover.style.display = "none";
      audio.pause();
      audio.currentTime = 0;
      if (imageLoadingInterval) {
        clearInterval(imageLoadingInterval);
      }
      imageElements = [];
      imagesContainer.innerHTML = "";
    }
  }

  if (dismissButton) dismissButton.addEventListener("click", dismiss);

  activate();
})();
