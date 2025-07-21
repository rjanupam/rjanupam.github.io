const fs = require("fs");
const path = require("path");
const markdownRender = require("./markdown.js").markdownRender;

// Configuration
const SITE_URL = "https://rjanupam.github.io";
const POSTS_DIR = path.join(__dirname, "../posts/markdown");
const POSTS_JSON = path.join(__dirname, "../posts/posts.json");
const RSS_PATH = path.join(__dirname, "../posts/rss_feed.xml");

// get first paragraph from markdown
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

    // sort
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = posts
      .map((post) => {
        const markdown = fs.readFileSync(
          path.join(POSTS_DIR, `${post.file}.md`),
          "utf-8",
        );
        const description = extractFirstParagraph(markdown);
        const fullContent = markdownRender(markdown);
        const postUrl = `${SITE_URL}/posts/viewer.html?post=${encodeURIComponent(post.file)}`;
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

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Anupam's Posts</title>
    <link>${SITE_URL}/posts/</link> 
    <description>Random posts by Anupam</description>
    <atom:link href="${SITE_URL}/posts/rss_feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    fs.writeFileSync(RSS_PATH, rssFeed);
    console.log("RSS feed generated successfully with SITE_URL: " + SITE_URL);
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    process.exit(1);
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "<";
      case ">":
        return ">";
      case "&":
        return "&";
      case "'":
        return "'";
      case '"':
        return '"';
    }
  });
}

generateRSS();
