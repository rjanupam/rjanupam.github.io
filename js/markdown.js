function markdownRender(markdownText) {
  function escapeHtml(text) {
    if (typeof text !== "string") return "";
    return text
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }

  function parseInline(text) {
    text = String(text);

    text = text
      .replace(/\\\\/g, "&bsol_esc;")
      .replace(/\\\*/g, "&ast_esc;")
      .replace(/\\\_/g, "&lowbar_esc;")
      .replace(/\\\`/g, "&grave_esc;")
      .replace(/\\~/g, "&tilde_esc;")
      .replace(/\\!/g, "&bang_esc;")
      .replace(/\\\(/g, "&lpar_esc;")
      .replace(/\\\)/g, "&rpar_esc;")
      .replace(/\\\[/g, "&lsqb_esc;")
      .replace(/\\\]/g, "&rsqb_esc;");

    // Code spans
    text = text.replace(/`{1,2}([^`]+?)`{1,2}/g, (match, codeContent) => {
      return `<code>${escapeHtml(codeContent)}</code>`;
    });

    // Images: Must be before links
    text = text.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      (match, alt, src) =>
        `<img src="${src.trim()}" alt="${parseInline.restoreEscapes(alt.trim())}">`,
    );

    // Links
    text = text.replace(
      /\[(.*?)\]\((.*?)\)/g,
      (match, linkText, url) =>
        `<a href="${url.trim()}">${parseInline.restoreEscapes(linkText.trim())}</a>`,
    );

    // Strong and Emphasis
    text = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\_\_(.*?)\_\_/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\_(.*?)\_/g, "<em>$1</em>");

    // Strikethrough
    text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");

    return parseInline.restoreEscapes(text);
  }

  parseInline.restoreEscapes = function (text) {
    return text
      .replace(/&ast_esc;/g, "*")
      .replace(/&lowbar_esc;/g, "_")
      .replace(/&grave_esc;/g, "`")
      .replace(/&tilde_esc;/g, "~")
      .replace(/&bang_esc;/g, "!")
      .replace(/&lpar_esc;/g, "(")
      .replace(/&rpar_esc;/g, ")")
      .replace(/&lsqb_esc;/g, "[")
      .replace(/&rsqb_esc;/g, "]")
      .replace(/&bsol_esc;/g, "\\");
  };

  const lines = markdownText.split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeBlockLang = "";
  let inBlockquote = false;
  let listStack = []; // { type: 'ul'|'ol', indent: number }
  let inParagraph = false;

  function ensureParagraphClosed() {
    if (inParagraph) {
      html = html.trimEnd();
      html += "</p>\n";
      inParagraph = false;
    }
  }

  function closeAllOpenLists() {
    while (listStack.length > 0) {
      const list = listStack.pop();
      html += `</${list.type}>\n`;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let originalLineForList = line;

    if (inCodeBlock) {
      if (line.startsWith("```")) {
        html += "</code></pre>\n";
        inCodeBlock = false;
        codeBlockLang = "";
      } else {
        html += escapeHtml(line) + "\n";
      }
      continue;
    }

    let trimmedLine = line.trim();

    if (inBlockquote && !trimmedLine.startsWith(">")) {
      ensureParagraphClosed();
      html += "</blockquote>\n";
      inBlockquote = false;
    }

    if (trimmedLine === "") {
      ensureParagraphClosed();
      if (listStack.length > 0 && !inBlockquote) {
        closeAllOpenLists();
      }
      continue;
    }

    // Start of fenced code block
    if (trimmedLine.startsWith("```")) {
      ensureParagraphClosed();
      closeAllOpenLists();
      codeBlockLang = trimmedLine.slice(3).trim();
      html += `<pre><code class="language-${escapeHtml(codeBlockLang) || "plaintext"}">`;
      inCodeBlock = true;
      continue;
    }

    // Horizontal rule
    if (trimmedLine.match(/^([-*_])\1{2,}\s*$/)) {
      ensureParagraphClosed();
      closeAllOpenLists();
      html += "<hr>\n";
      continue;
    }

    // Headers
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      ensureParagraphClosed();
      closeAllOpenLists();
      const level = headerMatch[1].length;
      const content = parseInline(headerMatch[2].trim());
      html += `<h${level}>${content}</h${level}>\n`;
      continue;
    }

    // Blockquotes
    if (trimmedLine.startsWith(">")) {
      if (!inBlockquote) {
        ensureParagraphClosed();
        closeAllOpenLists();
        html += "<blockquote>\n";
        inBlockquote = true;
      }
      line = trimmedLine.substring(1).trimLeft();
      originalLineForList = line;
      trimmedLine = line.trim();
      if (trimmedLine === "" && inParagraph) {
        ensureParagraphClosed();
      }
    }

    // Lists
    const listMatch = originalLineForList.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      ensureParagraphClosed();

      const indent = listMatch[1].length;
      const bullet = listMatch[2];
      let itemContent = listMatch[3];
      const currentListType = bullet.match(/\d+\./) ? "ol" : "ul";

      while (
        listStack.length > 0 &&
        (listStack[listStack.length - 1].indent > indent ||
          (listStack[listStack.length - 1].indent === indent &&
            listStack[listStack.length - 1].type !== currentListType))
      ) {
        const closingList = listStack.pop();
        html += `</${closingList.type}>\n`;
      }

      if (
        listStack.length === 0 ||
        listStack[listStack.length - 1].indent < indent ||
        (listStack[listStack.length - 1].indent === indent &&
          listStack[listStack.length - 1].type !== currentListType)
      ) {
        listStack.push({ type: currentListType, indent: indent });
        html += `<${currentListType}>\n`;
      }

      // multi-line list items
      let currentItemFullContent = [itemContent.trimRight()];
      let lookAheadIndex = i + 1;
      while (lookAheadIndex < lines.length) {
        const nextRawLine = lines[lookAheadIndex];
        const nextLineTrimmed = nextRawLine.trim();

        const nextLineInitialSpacesMatch = nextRawLine.match(/^(\s*)/);
        const nextLineIndent = nextLineInitialSpacesMatch
          ? nextLineInitialSpacesMatch[1].length
          : 0;

        const nextLineIsListItem = nextLineTrimmed.match(/^([-*+]|\d+\.)\s+.*/);
        const itemContentStartColumn =
          listMatch[1].length + listMatch[2].length + 1;

        if (
          nextLineTrimmed === "" ||
          (nextLineIndent >= itemContentStartColumn && !nextLineIsListItem)
        ) {
          currentItemFullContent.push(
            nextLineTrimmed === ""
              ? ""
              : nextRawLine.substring(itemContentStartColumn),
          );
          i = lookAheadIndex;
          lookAheadIndex++;
        } else {
          break;
        }
      }
      html += `<li>${parseInline(currentItemFullContent.join("\n").trim())}</li>\n`;
      continue;
    }

    if (listStack.length > 0 && !listMatch) {
      closeAllOpenLists();
    }

    if (trimmedLine !== "") {
      if (!inParagraph) {
        html += "<p>";
        inParagraph = true;
      }
      html += parseInline(trimmedLine) + " ";
    }
  }

  ensureParagraphClosed();
  closeAllOpenLists();
  if (inBlockquote) {
    ensureParagraphClosed();
    html += "</blockquote>\n";
  }
  if (inCodeBlock) {
    html += "</code></pre>\n";
  }

  return html.trim();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { markdownRender };
} else if (typeof window !== "undefined") {
  window.markdownRender = markdownRender;
}
