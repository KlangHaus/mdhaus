export const RECENT_FOLDERS_KEY = "open-mdhaus-recent-folders";
export const RECENT_FILES_KEY = "open-mdhaus-recent-files";
export const MAX_RECENT_FOLDERS = 5;
export const MAX_RECENT_FILES = 10;

export interface RecentFileEntry {
  path: string;
  workspaceRoot: string;
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

function parseRecentFiles(raw: string | null): RecentFileEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const entries: RecentFileEntry[] = [];
    for (const value of parsed) {
      if (typeof value === "string" && value.length > 0) {
        entries.push({ path: value, workspaceRoot: dirname(value) });
        continue;
      }

      if (
        value &&
        typeof value === "object" &&
        typeof (value as RecentFileEntry).path === "string" &&
        typeof (value as RecentFileEntry).workspaceRoot === "string"
      ) {
        const entry = value as RecentFileEntry;
        if (entry.path.length > 0 && entry.workspaceRoot.length > 0) {
          entries.push(entry);
        }
      }
    }

    return entries;
  } catch {
    return [];
  }
}

function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

export function loadRecentFolders(): string[] {
  return parseStringArray(localStorage.getItem(RECENT_FOLDERS_KEY));
}

export function saveRecentFolders(paths: string[]) {
  localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(paths));
}

export function loadRecentFiles(): RecentFileEntry[] {
  return parseRecentFiles(localStorage.getItem(RECENT_FILES_KEY));
}

export function saveRecentFiles(entries: RecentFileEntry[]) {
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(entries));
}

export function pushRecentFolder(path: string): string[] {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return loadRecentFolders();
  }

  const next = [trimmed, ...loadRecentFolders().filter((candidate) => candidate !== trimmed)].slice(
    0,
    MAX_RECENT_FOLDERS,
  );
  saveRecentFolders(next);
  return next;
}

export function pushRecentFile(entry: RecentFileEntry): RecentFileEntry[] {
  const path = entry.path.trim();
  const workspaceRoot = entry.workspaceRoot.trim();
  if (path.length === 0 || workspaceRoot.length === 0) {
    return loadRecentFiles();
  }

  const normalized: RecentFileEntry = { path, workspaceRoot };
  const next = [
    normalized,
    ...loadRecentFiles().filter((candidate) => candidate.path !== path),
  ].slice(0, MAX_RECENT_FILES);
  saveRecentFiles(next);
  return next;
}

export function removeRecentFolder(path: string): string[] {
  const next = loadRecentFolders().filter((candidate) => candidate !== path);
  saveRecentFolders(next);
  return next;
}

export function removeRecentFile(path: string): RecentFileEntry[] {
  const next = loadRecentFiles().filter((candidate) => candidate.path !== path);
  saveRecentFiles(next);
  return next;
}

export function replaceRecentFilePath(from: string, to: string): RecentFileEntry[] {
  const next = loadRecentFiles().map((entry) =>
    entry.path === from ? { ...entry, path: to } : entry,
  );
  saveRecentFiles(next);
  return next;
}

export function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

export function recentFileSubtitle(entry: RecentFileEntry): string {
  const rootPrefix = `${entry.workspaceRoot}/`;
  if (entry.path.startsWith(rootPrefix)) {
    const relative = entry.path.slice(rootPrefix.length);
    const slash = relative.lastIndexOf("/");
    if (slash === -1) {
      return basename(entry.workspaceRoot);
    }

    return relative.slice(0, slash);
  }

  const parent = dirname(entry.path);
  return parent.length > 0 ? basename(parent) : basename(entry.path);
}
