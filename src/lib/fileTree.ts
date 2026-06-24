import type { FileTreeNode } from "../types/files";

/** Depth-first list of markdown file paths in sidebar order. */
export function flattenMarkdownFiles(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.kind === "file") {
      paths.push(node.path);
      continue;
    }

    paths.push(...flattenMarkdownFiles(node.children));
  }

  return paths;
}

/** Filter the file tree by filename or content matches (case-insensitive substring). */
export function filterFileTree(
  nodes: FileTreeNode[],
  query: string,
  contentMatchPaths?: ReadonlySet<string>,
): FileTreeNode[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return nodes;
  }

  const contentPaths = contentMatchPaths ?? new Set<string>();
  const filtered: FileTreeNode[] = [];

  for (const node of nodes) {
    if (node.kind === "file") {
      const nameMatches = node.name.toLowerCase().includes(needle);
      const contentMatches = contentPaths.has(node.path);
      if (nameMatches || contentMatches) {
        filtered.push(node);
      }
      continue;
    }

    const nameMatches = node.name.toLowerCase().includes(needle);
    const children = nameMatches ? node.children : filterFileTree(node.children, query, contentPaths);

    if (nameMatches || children.length > 0) {
      filtered.push({
        ...node,
        children: nameMatches ? node.children : children,
      });
    }
  }

  return filtered;
}

/** Find cached file paths whose in-memory content matches the query. */
export function findCachedContentMatches(
  cachedContents: Record<string, string>,
  query: string,
): Set<string> {
  const needle = query.trim().toLowerCase();
  const matches = new Set<string>();

  if (needle.length < 2) {
    return matches;
  }

  for (const [path, fileContent] of Object.entries(cachedContents)) {
    if (fileContent.toLowerCase().includes(needle)) {
      matches.add(path);
    }
  }

  return matches;
}

function joinPath(root: string, name: string): string {
  return root.endsWith("/") ? `${root}${name}` : `${root}/${name}`;
}

/** Pick the first free untitled.md, untitled-1.md, … path under a folder. */
export function nextUntitledPath(root: string, existingPaths: string[]): string {
  const existing = new Set(existingPaths);
  let candidate = joinPath(root, "untitled.md");
  let counter = 1;

  while (existing.has(candidate)) {
    candidate = joinPath(root, `untitled-${counter}.md`);
    counter += 1;
  }

  return candidate;
}
