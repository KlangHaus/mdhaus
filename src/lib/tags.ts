import { stripYamlFrontMatter } from "./headings";

export interface TagEntry {
  tag: string;
  paths: string[];
  count: number;
}

const CODE_REGION_PATTERN = /(```[\s\S]*?```|`[^`\n]+`)/g;
const INLINE_TAG_PATTERN = /(?:^|\s)#([\p{L}\p{N}_-]+)/gmu;
const FRONT_MATTER_TAG_LINE = /^tags:\s*(.+)\s*$/im;
const FRONT_MATTER_LIST_TAG = /^\s*-\s+(.+)\s*$/;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "");
}

function protectCodeRegions(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const text = source.replace(CODE_REGION_PATTERN, (match) => {
    const token = `\u0000TAG_SLOT_${slots.length}\u0000`;
    slots.push(match);
    return token;
  });
  return { text, slots };
}

function restoreCodeRegions(text: string, slots: string[]): string {
  return text.replace(/\u0000TAG_SLOT_(\d+)\u0000/g, (_match, index: string) => {
    return slots[Number.parseInt(index, 10)] ?? "";
  });
}

function parseFrontMatterTags(source: string): string[] {
  if (!source.startsWith("---")) {
    return [];
  }

  const end = source.indexOf("\n---", 3);
  if (end === -1) {
    return [];
  }

  const block = source.slice(0, end + 4);
  const tags: string[] = [];
  const inlineMatch = FRONT_MATTER_TAG_LINE.exec(block);
  if (inlineMatch) {
    const value = inlineMatch[1].trim();
    if (value.startsWith("[")) {
      const list = value
        .slice(1, -1)
        .split(",")
        .map((item) => normalizeTag(item.replace(/['"]/g, "")))
        .filter((item) => item.length > 0);
      tags.push(...list);
    } else {
      value
        .split(",")
        .map((item) => normalizeTag(item))
        .filter((item) => item.length > 0)
        .forEach((item) => tags.push(item));
    }
  }

  for (const line of block.split("\n")) {
    const listMatch = FRONT_MATTER_LIST_TAG.exec(line);
    if (listMatch && block.includes("tags:")) {
      const normalized = normalizeTag(listMatch[1]);
      if (normalized.length > 0) {
        tags.push(normalized);
      }
    }
  }

  return [...new Set(tags)];
}

function parseInlineTags(body: string): string[] {
  const { text, slots } = protectCodeRegions(body);
  const tags = new Set<string>();

  for (const match of text.matchAll(INLINE_TAG_PATTERN)) {
    const tag = normalizeTag(match[1] ?? "");
    if (tag.length > 0) {
      tags.add(tag);
    }
  }

  restoreCodeRegions(text, slots);
  return [...tags];
}

export function extractTagsFromMarkdown(source: string): string[] {
  const { body } = stripYamlFrontMatter(source);
  const tags = new Set<string>([
    ...parseFrontMatterTags(source),
    ...parseInlineTags(body),
  ]);
  return [...tags];
}

export function buildWorkspaceTagIndex(sources: Record<string, string>): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const [path, content] of Object.entries(sources)) {
    for (const tag of extractTagsFromMarkdown(content)) {
      if (!index[tag]) {
        index[tag] = [];
      }
      index[tag].push(path);
    }
  }

  for (const tag of Object.keys(index)) {
    index[tag] = [...new Set(index[tag])].sort();
  }

  return index;
}

export function listWorkspaceTags(sources: Record<string, string>): TagEntry[] {
  const index = buildWorkspaceTagIndex(sources);
  return Object.entries(index)
    .map(([tag, paths]) => ({ tag, paths, count: paths.length }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}

export function fileMatchesTag(path: string, tag: string, sources: Record<string, string>): boolean {
  const normalized = normalizeTag(tag);
  const fileTags = extractTagsFromMarkdown(sources[path] ?? "");
  return fileTags.includes(normalized);
}
