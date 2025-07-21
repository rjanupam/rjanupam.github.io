// Generate a persistent visitor ID
function getVisitorId() {
  let vid = localStorage.getItem("visitorId");
  if (!vid) {
    vid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("visitorId", vid);
  }
  return vid;
}

// Format view count
function formatViewCount(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

// Display the view counter
function showViewCounter(count) {
  const container = document.getElementById("view-counter-container");
  if (!container) return;

  const countElement = container.querySelector(".view-count");
  if (!countElement) return;

  countElement.textContent = formatViewCount(count);
  container.style.display = "flex";

  setTimeout(() => {
    container.classList.add("visible");
  }, 100);
}

// Track view and update counter
async function trackView(postId) {
  const container = document.getElementById("view-counter-container");
  if (!container) return;

  try {
    const response = await fetch(
      `https://views.rjanupam.me/?post=${postId}&vid=${getVisitorId()}`,
      { credentials: "omit" },
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    if (data.views) {
      showViewCounter(data.views);
    }
  } catch (error) {
    console.error("View tracking failed:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const viewCounterContainer = document.getElementById(
    "view-counter-container",
  );
  if (!viewCounterContainer) return;

  let postId;
  const postIdMeta = document.querySelector('meta[name="post-id"]');

  if (postIdMeta) {
    postId = postIdMeta.content;
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get("post");

    if (!postId) {
      const pathParts = window.location.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.endsWith(".html")) {
        postId = lastPart.substring(0, lastPart.length - ".html".length);
      }
    }
  }

  if (postId) {
    if (typeof trackView === "function") {
      setTimeout(() => trackView(postId), 500);
    }
  } else {
    console.log("No post ID found for view tracking.");
  }
});
