import type { FileTreeNode } from "../types/files";

/** Depth-first list of directory paths in sidebar order. */
export function flattenDirectoryPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.kind !== "dir") {
      continue;
    }

    paths.push(node.path);
    paths.push(...flattenDirectoryPaths(node.children));
  }

  return paths;
}

/** Pick the first free untitled-folder, untitled-folder-1, … path under a parent. */
export function nextUntitledFolderPath(parent: string, existingDirPaths: string[]): string {
  const existing = new Set(existingDirPaths);
  let candidate = joinPath(parent, "untitled-folder");
  let counter = 1;

  while (existing.has(candidate)) {
    candidate = joinPath(parent, `untitled-folder-${counter}`);
    counter += 1;
  }

  return candidate;
}

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

export function filterFileTreeByPaths(
  nodes: FileTreeNode[],
  allowedPaths: ReadonlySet<string>,
): FileTreeNode[] {
  const filtered: FileTreeNode[] = [];

  for (const node of nodes) {
    if (node.kind === "file") {
      if (allowedPaths.has(node.path)) {
        filtered.push(node);
      }
      continue;
    }

    const children = filterFileTreeByPaths(node.children, allowedPaths);
    if (children.length > 0) {
      filtered.push({
        ...node,
        children,
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
  return nextAvailablePath(root, existingPaths, "untitled.md");
}

/** Pick the first free path for a filename, appending -1, -2, … before the extension when needed. */
export function nextAvailablePath(root: string, existingPaths: string[], fileName: string): string {
  const existing = new Set(existingPaths);
  const initial = joinPath(root, fileName);
  if (!existing.has(initial)) {
    return initial;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);
  const extension = dotIndex === -1 ? "" : fileName.slice(dotIndex);
  let counter = 1;

  while (true) {
    const candidate = joinPath(root, `${base}-${counter}${extension}`);
    if (!existing.has(candidate)) {
      return candidate;
    }

    counter += 1;
  }
}
