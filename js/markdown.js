function markdownRender(markdownText) {
  // Basic inline elements
  function parseInline(text) {
    return text
      .replace(/\\\*/g, "&ast;")
      .replace(/\\_/g, "&lowbar;") // Escape chars
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\_\_(.*?)\_\_/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\_(.*?)\_/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  const lines = markdownText.split("\n");
  let html = "";
  let inCodeBlock = false;
  let inBlockquote = false;
  let inList = false;
  let listType = "";
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trimRight();

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += "</code></pre>\n";
        inCodeBlock = false;
      } else {
        const lang = line.slice(3).trim();
        html += `<pre><code class="${lang}">`;
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html += line + "\n";
      continue;
    }

    // Blockquotes
    if (line.startsWith(">")) {
      if (!inBlockquote) {
        html += "<blockquote>";
        inBlockquote = true;
      }
      html += parseInline(line.slice(1).trim()) + "<br>";
      continue;
    } else if (inBlockquote) {
      html += "</blockquote>\n";
      inBlockquote = false;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s(.*)/);
    if (headerMatch) {
      if (inParagraph) {
        html += "</p>\n";
        inParagraph = false;
      }
      const level = headerMatch[1].length;
      const content = parseInline(headerMatch[2]);
      html += `<h${level}>${content}</h${level}>\n`;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      if (inParagraph) {
        html += "</p>\n";
        inParagraph = false;
      }
      html += "<hr>\n";
      continue;
    }

    // Lists
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s(.*)/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const bullet = listMatch[2];
      const content = parseInline(listMatch[3]);

      if (!inList) {
        listType = bullet.match(/\d+\./) ? "ol" : "ul";
        html += `<${listType}>\n`;
        inList = true;
      }

      html += `<li>${content}</li>\n`;
      continue;
    } else if (inList) {
      html += `</${listType}>\n`;
      inList = false;
    }

    // Empty line ends para
    if (line === "") {
      if (inParagraph) {
        html += "</p>\n";
        inParagraph = false;
      }
      continue;
    }

    // Start new para if needed
    if (!inParagraph) {
      html += "<p>";
      inParagraph = true;
    }

    html += parseInline(line) + " ";
  }

  // Close any remaining open tags
  if (inParagraph) html += "</p>\n";
  if (inList) html += `</${listType}>\n`;
  if (inBlockquote) html += "</blockquote>\n";
  if (inCodeBlock) html += "</code></pre>\n";

  return html.trim();
}

if (typeof window !== "undefined") {
  window.markdownRender = markdownRender;
}
