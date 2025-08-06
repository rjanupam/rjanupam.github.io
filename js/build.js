const fs = require("fs");
const path = require("path");
const markdownRender = require("./markdown.js").markdownRender;

// Configuration
const SITE_URL = "https://rjanupam.github.io";
const POSTS_DIR_MD = path.join(__dirname, "../posts/markdown");
const POSTS_DIR_HTML = path.join(__dirname, "../posts/articles");
const POSTS_JSON = path.join(__dirname, "../posts/posts.json");
const RSS_PATH = path.join(__dirname, "../posts/rss_feed.xml");

function extractFirstParagraph(markdown) {
  const firstParagraph = markdown
    .split("\n\n")
    .find((p) => p.trim().length > 0);
  return firstParagraph ? firstParagraph.replace(/#+\s*/g, "").trim() : "";
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

// HTML Template for a single post
function getPostHTMLTemplate(post, htmlContent, postId) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/jpg" href="../../static/images/profile_pic.jpg" />
    <title>${escapeXml(post.title)} - anupam's post</title>
    <link rel="stylesheet" href="../../static/style.css" />
    <link
      rel="stylesheet"
      id="hljs-theme-light"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css"
      media="not all"
      disabled
    />
    <link
      rel="stylesheet"
      id="hljs-theme-dark"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css"
      media="not all"
      disabled
    />
    <meta name="post-id" content="${postId}">
  </head>
  <body>
    <div class="screen">
      <header>
        <div class="name">anupam</div>
        <nav class="nav-bar">
          <a href="../index.html">back to posts</a>
          <div
            id="view-counter-container"
            class="view-counter"
            style="display: none"
          >
            <span class="view-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            <span class="view-count">0</span>
            <span class="view-label">views</span>
          </div>
        </nav>
      </header>
      <hr />
      <main id="post-content">
        ${htmlContent}
      </main>
      <footer>
        <p>© ${new Date().getFullYear()} rjanupam.me</p>
      </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        if (typeof hljs !== "undefined") {
          document.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block);
          });
          const currentSiteTheme = document.documentElement.getAttribute("data-theme") || "light";
          if (typeof updateHljsTheme === 'function') {
             updateHljsTheme(currentSiteTheme);
          }
        } else {
          console.warn(
            "highlight.js not loaded, code blocks will not be highlighted.",
          );
        }
      });
    </script>
    <div id="lain-takeover" class="lain-takeover" style="display: none">
      <div class="lain-text"></div>
      <div id="lain-images" class="lain-images"></div>
      <button id="lain-dismiss" class="lain-dismiss">✖</button>
    </div>
    <audio id="lain-audio" loop src="../../static/audio/lain-takeover.mp3"></audio>
    <script src="../../js/script.js"></script>
    <script src="../../js/views-count.js"></script>
  </body>
</html>`;
}

function generateSite() {
  try {
    const posts = JSON.parse(fs.readFileSync(POSTS_JSON, "utf-8"));
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    posts.forEach((post) => {
      const outputFilePath = path.join(POSTS_DIR_HTML, `${post.file}.html`);
      if (fs.existsSync(outputFilePath)) {
        console.log(`Skipping: ${post.file}.html already exists.`);
        return; // skip
      }

      const markdown = fs.readFileSync(
        path.join(POSTS_DIR_MD, `${post.file}.md`),
        "utf-8",
      );
      const htmlContent = markdownRender(markdown);
      const fullHtmlPage = getPostHTMLTemplate(post, htmlContent, post.file);

      fs.writeFileSync(outputFilePath, fullHtmlPage);
      console.log(`Generated HTML for: ${post.file}.html`);
    });

    let existingGuids = new Set();
    let existingItems = "";

    if (fs.existsSync(RSS_PATH)) {
      const existingFeed = fs.readFileSync(RSS_PATH, "utf-8");

      const guidRegex = /<guid>(.*?)<\/guid>/g;
      let match;
      while ((match = guidRegex.exec(existingFeed)) !== null)
        existingGuids.add(match[1]);

      const itemsRegex = /<channel>([\s\S]*?)<\/channel>/;
      const channelMatch = existingFeed.match(itemsRegex);
      if (channelMatch && channelMatch[1]) {
        const innerContent = channelMatch[1];
        // everything but the channel's metadata
        existingItems = innerContent
          .replace(/<title>.*<\/title>/, "")
          .replace(/<link>.*<\/link>/, "")
          .replace(/<description>.*<\/description>/, "")
          .replace(/<atom:link.*?\/>/, "")
          .trim();
      }
    }

    const newPosts = posts.filter((post) => {
      const postUrl = `${SITE_URL}/posts/articles/${post.file}.html`;
      return !existingGuids.has(postUrl);
    });

    if (newPosts.length > 0) {
      const newItems = newPosts
        .map((post) => {
          const markdown = fs.readFileSync(
            path.join(POSTS_DIR_MD, `${post.file}.md`),
            "utf-8",
          );
          const description = extractFirstParagraph(markdown);
          const fullContent = markdownRender(markdown);
          const postUrl = `${SITE_URL}/posts/articles/${post.file}.html`;
          const readMoreLink = `<p><a href="${postUrl}">Read full post</a></p>`;

          return `
            <item>
              <title>${escapeXml(post.title)}</title>
              <link>${postUrl}</link>
              <guid>${postUrl}</guid>
              <pubDate>${new Date(post.date).toUTCString()}</pubDate>
              <description><![CDATA[${description} ${readMoreLink}]]></description>
              <content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/">
                <![CDATA[${fullContent} ${readMoreLink}]]>
              </content:encoded>
            </item>
          `;
        })
        .join("\n");

      console.log(`Adding ${newPosts.length} new item(s) to the RSS feed.`);
      existingItems = newItems + "\n" + existingItems;
    } else {
      console.log("RSS feed is already up-to-date. No new items to add.");
    }

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Anupam's Posts</title>
    <link>${SITE_URL}/posts/</link>
    <description>Random posts by Anupam</description>
    <atom:link href="${SITE_URL}/posts/rss_feed.xml" rel="self" type="application/rss+xml" />
    ${existingItems}
  </channel>
</rss>`;

    fs.writeFileSync(RSS_PATH, rssFeed);
    console.log("RSS feed generation complete.");

    console.log("Site generation complete. SITE_URL for links: " + SITE_URL);
  } catch (error) {
    console.error("Error generating site:", error);
    process.exit(1);
  }
}

generateSite();
