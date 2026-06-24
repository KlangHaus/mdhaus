import {
  loadRecentFiles,
  loadRecentFolders,
  pushRecentFile,
  pushRecentFolder,
  removeRecentFile,
  removeRecentFolder,
  replaceRecentFilePath,
  type RecentFileEntry,
} from "../types/recent";

export function recordRecentFolder(path: string): string[] {
  return pushRecentFolder(path);
}

export function recordRecentFile(path: string, workspaceRoot: string | null): RecentFileEntry[] {
  const root = workspaceRoot ?? dirname(path);
  if (root.length === 0) {
    return loadRecentFiles();
  }

  return pushRecentFile({ path, workspaceRoot: root });
}

export function forgetRecentFile(path: string): RecentFileEntry[] {
  return removeRecentFile(path);
}

export function forgetRecentFolder(path: string): string[] {
  return removeRecentFolder(path);
}

export function renameRecentFile(from: string, to: string): RecentFileEntry[] {
  return replaceRecentFilePath(from, to);
}

export function getRecentFolders(): string[] {
  return loadRecentFolders();
}

export function getRecentFiles(): RecentFileEntry[] {
  return loadRecentFiles();
}

function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}
