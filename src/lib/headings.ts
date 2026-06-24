export interface MarkdownHeading {
  level: number;
  text: string;
  id: string;
}

interface OutlineEntry extends MarkdownHeading {
  line: number;
  kind: "atx" | "yaml-title" | "section";
}

const SECTION_TITLE_MAX_LENGTH = 72;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function slugifyHeading(text: string): string {
  return slugify(text) || "section";
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function truncateSectionTitle(text: string): string {
  const plain = stripInlineMarkdown(text);
  if (plain.length <= SECTION_TITLE_MAX_LENGTH) {
    return plain;
  }

  return `${plain.slice(0, SECTION_TITLE_MAX_LENGTH - 1).trim()}…`;
}

function nextHeadingId(text: string, slugCounts: Map<string, number>): string {
  const base = slugifyHeading(text);
  const count = slugCounts.get(base) ?? 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function parseYamlFrontMatter(source: string): { title: string | null; closingLineIndex: number } {
  if (!source.startsWith("---")) {
    return { title: null, closingLineIndex: -1 };
  }

  const lines = source.split("\n");
  for (let index = 1; index < lines.length; index++) {
    if (lines[index].trim() !== "---") {
      continue;
    }

    const frontMatter = lines.slice(1, index).join("\n");
    const quotedMatch = /^title:\s*"([^"]+)"/m.exec(frontMatter);
    const singleQuotedMatch = /^title:\s*'([^']+)'/m.exec(frontMatter);
    const plainMatch = /^title:\s*(.+)\s*$/m.exec(frontMatter);
    const title =
      quotedMatch?.[1] ??
      singleQuotedMatch?.[1] ??
      plainMatch?.[1]?.trim() ??
      null;

    return { title, closingLineIndex: index };
  }

  return { title: null, closingLineIndex: -1 };
}

function findNextSectionLine(lines: string[], startIndex: number): number | null {
  for (let index = startIndex; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed === "---") {
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      return null;
    }

    return index;
  }

  return null;
}

/** Build TOC entries from ATX headings, YAML title, and `---` section breaks. */
export function buildDocumentOutline(source: string): OutlineEntry[] {
  const lines = source.split("\n");
  const outline: OutlineEntry[] = [];
  const slugCounts = new Map<string, number>();
  const { title, closingLineIndex } = parseYamlFrontMatter(source);
  let frontMatterClosed = closingLineIndex === -1;

  if (title) {
    outline.push({
      level: 1,
      text: title,
      id: nextHeadingId(title, slugCounts),
      line: 1,
      kind: "yaml-title",
    });
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const atxMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (atxMatch) {
      const text = atxMatch[2].replace(/\s+#+\s*$/, "").trim();
      outline.push({
        level: atxMatch[1].length,
        text,
        id: nextHeadingId(text, slugCounts),
        line: index + 1,
        kind: "atx",
      });
      continue;
    }

    if (!frontMatterClosed) {
      if (index === 0) {
        continue;
      }

      if (line.trim() === "---") {
        frontMatterClosed = true;
      }

      continue;
    }

    if (line.trim() !== "---") {
      continue;
    }

    const sectionLineIndex = findNextSectionLine(lines, index + 1);
    if (sectionLineIndex === null) {
      continue;
    }

    const sectionTitle = truncateSectionTitle(lines[sectionLineIndex]);
    if (sectionTitle.length === 0) {
      continue;
    }

    outline.push({
      level: 2,
      text: sectionTitle,
      id: nextHeadingId(sectionTitle, slugCounts),
      line: sectionLineIndex + 1,
      kind: "section",
    });
  }

  return outline;
}

/** Extract headings for preview TOC. */
export function extractHeadings(source: string): MarkdownHeading[] {
  return buildDocumentOutline(source).map(({ level, text, id }) => ({ level, text, id }));
}

/** Find the 1-based source line for a heading id from the document outline. */
export function findHeadingLineNumber(source: string, headingId: string): number | null {
  const entry = buildDocumentOutline(source).find((heading) => heading.id === headingId);
  return entry?.line ?? null;
}

export function stripYamlFrontMatter(source: string): { body: string; hadFrontMatter: boolean } {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(source);
  if (!match) {
    return { body: source, hadFrontMatter: false };
  }

  return {
    body: source.slice(match[0].length),
    hadFrontMatter: true,
  };
}

export function injectSectionAnchors(body: string, outline: OutlineEntry[]): string {
  const sections = outline.filter((entry) => entry.kind === "section");
  let sectionIndex = 0;
  const lines = body.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    result.push(line);

    if (line.trim() !== "---" || sectionIndex >= sections.length) {
      continue;
    }

    const entry = sections[sectionIndex];
    sectionIndex += 1;
    result.push("");
    result.push(`<div id="${entry.id}" class="markdown-section-anchor"></div>`);
  }

  return result.join("\n");
}
