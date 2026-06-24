export interface ParsedWikilink {
  target: string;
  alias: string | null;
  heading: string | null;
}

export interface WikilinkRenderContext {
  workspaceFiles: string[];
  currentFilePath: string | null;
}

const WIKILINK_PATTERN = /\[\[([^\]\n]+)\]\]/g;
const CODE_REGION_PATTERN = /(```[\s\S]*?```|`[^`\n]+`)/g;
const MARKDOWN_EXTENSIONS = ["md", "markdown", "mdx", "txt"];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

function stripExtension(name: string): string {
  return name.replace(/\.(md|markdown|mdx|txt)$/i, "");
}

function normalizeTarget(target: string): string {
  return stripExtension(target.trim());
}

function fileStem(filePath: string): string {
  return stripExtension(basename(filePath));
}

function withMarkdownExtension(pathWithoutExt: string): string[] {
  return MARKDOWN_EXTENSIONS.map((extension) => `${pathWithoutExt}.${extension}`);
}

function buildCandidates(target: string, currentFilePath: string | null): string[] {
  const normalized = normalizeTarget(target);
  if (normalized.length === 0) {
    return [];
  }

  const candidates = new Set<string>([normalized, ...withMarkdownExtension(normalized)]);

  if (currentFilePath) {
    const parent = dirname(currentFilePath);
    if (parent.length > 0) {
      const relativeBase = `${parent}/${normalized}`;
      candidates.add(relativeBase);
      for (const extensionPath of withMarkdownExtension(relativeBase)) {
        candidates.add(extensionPath);
      }
    }
  }

  return [...candidates];
}

function scoreMatch(filePath: string, target: string, currentFilePath: string | null): number {
  const normalized = normalizeTarget(target);
  const lowerPath = filePath.toLowerCase();
  const lowerTarget = normalized.toLowerCase();
  const pathWithoutExt = stripExtension(filePath);
  let score = 0;

  if (pathWithoutExt === normalized || pathWithoutExt.toLowerCase() === lowerTarget) {
    score += 120;
  }

  if (lowerPath.endsWith(`/${lowerTarget}`) || lowerPath.endsWith(`/${lowerTarget}.md`)) {
    score += 80;
  }

  if (fileStem(filePath).toLowerCase() === basename(normalized).toLowerCase()) {
    score += 40;
  }

  if (currentFilePath) {
    const currentParent = dirname(currentFilePath);
    const matchParent = dirname(filePath);
    if (matchParent === currentParent) {
      score += 25;
    }
  }

  const depth = filePath.split("/").length;
  score -= depth;

  return score;
}

export function parseWikilinkInner(inner: string): ParsedWikilink {
  let body = inner.trim();
  let alias: string | null = null;
  const pipeIndex = body.indexOf("|");

  if (pipeIndex !== -1) {
    alias = body.slice(pipeIndex + 1).trim();
    body = body.slice(0, pipeIndex).trim();
  }

  let heading: string | null = null;
  const hashIndex = body.indexOf("#");

  if (hashIndex !== -1) {
    heading = body.slice(hashIndex + 1).trim();
    body = body.slice(0, hashIndex).trim();
  }

  return {
    target: body,
    alias: alias && alias.length > 0 ? alias : null,
    heading: heading && heading.length > 0 ? heading : null,
  };
}

export function resolveWikilinkPath(
  target: string,
  workspaceFiles: string[],
  currentFilePath: string | null,
): string | null {
  const trimmed = target.trim();
  if (trimmed.length === 0 || workspaceFiles.length === 0) {
    return null;
  }

  const candidates = buildCandidates(trimmed, currentFilePath);
  for (const candidate of candidates) {
    const exact = workspaceFiles.find((filePath) => filePath === candidate);
    if (exact) {
      return exact;
    }
  }

  const normalized = normalizeTarget(trimmed);
  const basenameTarget = basename(normalized).toLowerCase();
  const ranked = workspaceFiles
    .map((filePath) => ({ filePath, score: scoreMatch(filePath, trimmed, currentFilePath) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    return null;
  }

  const topScore = ranked[0]?.score ?? 0;
  const topMatches = ranked.filter((entry) => entry.score === topScore);
  if (topMatches.length === 1) {
    return topMatches[0]?.filePath ?? null;
  }

  const sameStem = topMatches.filter((entry) => fileStem(entry.filePath).toLowerCase() === basenameTarget);
  if (sameStem.length === 1) {
    return sameStem[0]?.filePath ?? null;
  }

  return ranked[0]?.filePath ?? null;
}

function wikilinkDisplayText(parsed: ParsedWikilink): string {
  if (parsed.alias) {
    return parsed.alias;
  }

  const segments = normalizeTarget(parsed.target).split("/");
  return segments[segments.length - 1] ?? parsed.target;
}

function renderWikilinkHtml(parsed: ParsedWikilink, context: WikilinkRenderContext): string {
  const display = escapeHtml(wikilinkDisplayText(parsed));
  const resolvedPath = resolveWikilinkPath(parsed.target, context.workspaceFiles, context.currentFilePath);

  if (!resolvedPath) {
    return `<span class="markdown-wikilink markdown-wikilink--missing">${display}</span>`;
  }

  const pathAttr = escapeAttribute(resolvedPath);
  const headingAttr =
    parsed.heading !== null && parsed.heading.length > 0
      ? ` data-wikilink-heading="${escapeAttribute(parsed.heading)}"`
      : "";

  return `<a href="#" class="markdown-wikilink" data-wikilink-path="${pathAttr}"${headingAttr}>${display}</a>`;
}

function protectCodeRegions(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];

  const text = source.replace(CODE_REGION_PATTERN, (match) => {
    const token = `\u0000WIKILINK_SLOT_${slots.length}\u0000`;
    slots.push(match);
    return token;
  });

  return { text, slots };
}

function restoreCodeRegions(text: string, slots: string[]): string {
  return text.replace(/\u0000WIKILINK_SLOT_(\d+)\u0000/g, (_match, index: string) => {
    return slots[Number.parseInt(index, 10)] ?? "";
  });
}

export function replaceWikilinks(source: string, context: WikilinkRenderContext): string {
  const { text, slots } = protectCodeRegions(source);

  const replaced = text.replace(WIKILINK_PATTERN, (_match, inner: string) =>
    renderWikilinkHtml(parseWikilinkInner(inner), context),
  );

  return restoreCodeRegions(replaced, slots);
}
