export interface MarkdownHeading {
  level: number;
  text: string;
  id: string;
}

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

/** Extract ATX headings (# …) for a simple table of contents. */
export function extractHeadings(source: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const slugCounts = new Map<string, number>();

  for (const line of source.split("\n")) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = match[2].replace(/\s+#+\s*$/, "").trim();
    const base = slugifyHeading(text);
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;

    headings.push({ level, text, id });
  }

  return headings;
}
