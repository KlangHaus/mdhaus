import { stripYamlFrontMatter } from "./headings";

export interface FrontMatterFields {
  title: string;
  date: string;
  author: string;
  tags: string;
}

export interface ParsedFrontMatter {
  hasFrontMatter: boolean;
  fields: FrontMatterFields;
  extraLines: string[];
  body: string;
}

const KNOWN_FIELD_KEYS = new Set(["title", "date", "author", "tags"]);

export function emptyFrontMatterFields(): FrontMatterFields {
  return {
    title: "",
    date: "",
    author: "",
    tags: "",
  };
}

function parseYamlScalar(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseTagsValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((part) => parseYamlScalar(part.trim()))
      .filter((part) => part.length > 0)
      .join(", ");
  }

  return parseYamlScalar(trimmed);
}

function serializeYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (/[:#\[\]{}|>&*!?,\s"]/.test(trimmed)) {
    return `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }

  return trimmed;
}

function hasAnyFrontMatterField(fields: FrontMatterFields): boolean {
  return (
    fields.title.trim().length > 0 ||
    fields.date.trim().length > 0 ||
    fields.author.trim().length > 0 ||
    fields.tags.trim().length > 0
  );
}

export function parseFrontMatterDocument(source: string): ParsedFrontMatter {
  const { body, hadFrontMatter } = stripYamlFrontMatter(source);
  if (!hadFrontMatter) {
    return {
      hasFrontMatter: false,
      fields: emptyFrontMatterFields(),
      extraLines: [],
      body: source,
    };
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  const yamlBlock = match?.[1] ?? "";
  const fields = emptyFrontMatterFields();
  const extraLines: string[] = [];

  for (const line of yamlBlock.split("\n")) {
    const keyValueMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!keyValueMatch) {
      if (line.trim().length > 0) {
        extraLines.push(line);
      }

      continue;
    }

    const key = keyValueMatch[1];
    const value = keyValueMatch[2];

    if (key === "title") {
      fields.title = parseYamlScalar(value);
      continue;
    }

    if (key === "date") {
      fields.date = parseYamlScalar(value);
      continue;
    }

    if (key === "author") {
      fields.author = parseYamlScalar(value);
      continue;
    }

    if (key === "tags") {
      fields.tags = parseTagsValue(value);
      continue;
    }

    if (!KNOWN_FIELD_KEYS.has(key)) {
      extraLines.push(line);
    }
  }

  return {
    hasFrontMatter: true,
    fields,
    extraLines,
    body,
  };
}

export function applyFrontMatterFields(source: string, fields: FrontMatterFields): string {
  const parsed = parseFrontMatterDocument(source);
  const normalizedBody = parsed.body.replace(/^\n+/, "");
  const hasValues = hasAnyFrontMatterField(fields);

  if (!hasValues && parsed.extraLines.length === 0) {
    return normalizedBody;
  }

  const lines = ["---"];

  if (fields.title.trim().length > 0) {
    lines.push(`title: ${serializeYamlScalar(fields.title)}`);
  }

  if (fields.date.trim().length > 0) {
    lines.push(`date: ${fields.date.trim()}`);
  }

  if (fields.author.trim().length > 0) {
    lines.push(`author: ${serializeYamlScalar(fields.author)}`);
  }

  if (fields.tags.trim().length > 0) {
    lines.push(`tags: ${serializeYamlScalar(fields.tags)}`);
  }

  lines.push(...parsed.extraLines, "---", "");

  return `${lines.join("\n")}${normalizedBody}`;
}
