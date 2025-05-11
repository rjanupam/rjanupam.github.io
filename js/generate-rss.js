const fs = require("fs");
const path = require("path");

// Configuration
const SITE_URL = "https://rjanupam.github.io";
const POSTS_DIR = path.join(__dirname, "../posts/markdown");
const POSTS_JSON = path.join(__dirname, "../posts/posts.json");
const RSS_PATH = path.join(__dirname, "../posts/rss_feed.xml");

// Helper function to extract first paragraph from markdown
function extractFirstParagraph(markdown) {
  const firstParagraph = markdown
    .split("\n\n")
    .find((p) => p.trim().length > 0);
  return firstParagraph ? firstParagraph.replace(/#+\s*/g, "").trim() : "";
}

// Generate RSS feed
function generateRSS() {
  try {
    const posts = JSON.parse(fs.readFileSync(POSTS_JSON, "utf-8"));

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = posts
      .map((post) => {
        const markdown = fs.readFileSync(
          path.join(POSTS_DIR, `${post.file}.md`),
          "utf-8",
        );
        const description = extractFirstParagraph(markdown);

        return `
        <item>
          <title>${post.title}</title>
          <link>${SITE_URL}/posts/viewer.html?post=${encodeURIComponent(post.file)}</link>
          <guid>${SITE_URL}/posts/viewer.html?post=${encodeURIComponent(post.file)}</guid>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          <description><![CDATA[${description}]]></description>
        </item>
      `;
      })
      .join("\n");

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anupam's Posts</title>
    <link>${SITE_URL}/posts</link>
    <description>Random posts by Anupam</description>
    <atom:link href="${SITE_URL}/posts/rss_feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    fs.writeFileSync(RSS_PATH, rssFeed);
    console.log("RSS feed generated successfully!");
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    process.exit(1);
  }
}

generateRSS();
