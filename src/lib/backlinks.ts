import { parseWikilinkInner, resolveWikilinkPath } from "./wikilinks";

const WIKILINK_PATTERN = /\[\[([^\]\n]+)\]\]/g;
const CODE_REGION_PATTERN = /(```[\s\S]*?```|`[^`\n]+`)/g;

export interface BacklinkEntry {
  path: string;
  label: string;
}

function protectCodeRegions(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const text = source.replace(CODE_REGION_PATTERN, (match) => {
    const token = `\u0000BL_SLOT_${slots.length}\u0000`;
    slots.push(match);
    return token;
  });
  return { text, slots };
}

function restoreCodeRegions(text: string, slots: string[]): string {
  return text.replace(/\u0000BL_SLOT_(\d+)\u0000/g, (_match, index: string) => {
    return slots[Number.parseInt(index, 10)] ?? "";
  });
}

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

function stripExtension(name: string): string {
  return name.replace(/\.(md|markdown|mdx|txt)$/i, "");
}

export function findBacklinksForFile(
  targetPath: string,
  sources: Record<string, string>,
  workspaceFiles: string[],
): BacklinkEntry[] {
  const entries: BacklinkEntry[] = [];
  const targetStem = stripExtension(basename(targetPath)).toLowerCase();

  for (const [path, source] of Object.entries(sources)) {
    if (path === targetPath) {
      continue;
    }

    const { text, slots } = protectCodeRegions(source);
    let matched = false;

    for (const match of text.matchAll(WIKILINK_PATTERN)) {
      const inner = match[1];
      if (!inner) {
        continue;
      }

      const parsed = parseWikilinkInner(inner);
      const resolved = resolveWikilinkPath(parsed.target, workspaceFiles, path);
      if (resolved === targetPath) {
        matched = true;
        break;
      }

      const normalized = stripExtension(parsed.target.trim()).toLowerCase();
      const normalizedBasename = basename(normalized);
      if (normalizedBasename === targetStem || normalized === targetStem) {
        matched = true;
        break;
      }
    }

    if (matched) {
      entries.push({ path, label: basename(path) });
    }

    restoreCodeRegions(text, slots);
  }

  return entries.sort((left, right) => left.label.localeCompare(right.label));
}
