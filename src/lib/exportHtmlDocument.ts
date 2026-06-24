import exportHtmlStyles from "../styles/export-html.css?raw";
import { parseFrontMatterDocument } from "./frontMatter";
import { renderMarkdown } from "./markdown";
import { MARKDOWN_CONTENT_CLASS } from "./printDocument";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class ExportHtmlDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportHtmlDocumentError";
  }
}

export function defaultHtmlExportPath(filePath: string | null): string {
  if (!filePath) {
    return "untitled.html";
  }

  const lastSlash = filePath.lastIndexOf("/");
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot > lastSlash) {
    return `${filePath.slice(0, lastDot)}.html`;
  }

  return `${filePath}.html`;
}

export async function buildHtmlDocument(options: {
  title: string;
  markdown: string;
  lang?: string;
}): Promise<string> {
  if (options.markdown.trim().length === 0) {
    throw new ExportHtmlDocumentError("empty");
  }

  const bodyHtml = await renderMarkdown(options.markdown);
  const parsed = parseFrontMatterDocument(options.markdown);
  const pageTitle = parsed.fields.title.trim() || options.title;
  const lang = escapeHtml(options.lang ?? "en");
  const escapedTitle = escapeHtml(pageTitle);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style>${exportHtmlStyles}</style>
</head>
<body>
  <main class="${MARKDOWN_CONTENT_CLASS}" lang="${lang}">
${bodyHtml}
  </main>
</body>
</html>
`;
}
