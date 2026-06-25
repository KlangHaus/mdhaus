export const FAVOURITE_FILES_KEY = "open-mdhaus-favourite-files";

function parseFavouriteFiles(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  } catch {
    return [];
  }
}

function saveFavouriteFiles(paths: string[]) {
  localStorage.setItem(FAVOURITE_FILES_KEY, JSON.stringify(paths));
}

export function loadFavouriteFiles(): string[] {
  return parseFavouriteFiles(localStorage.getItem(FAVOURITE_FILES_KEY));
}

export function toggleFavouriteFile(path: string): string[] {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return loadFavouriteFiles();
  }

  const current = loadFavouriteFiles();
  const next = current.includes(trimmed)
    ? current.filter((candidate) => candidate !== trimmed)
    : [trimmed, ...current];
  saveFavouriteFiles(next);
  return next;
}

export function replaceFavouriteFilePath(from: string, to: string): string[] {
  const next = loadFavouriteFiles().map((entry) => (entry === from ? to : entry));
  saveFavouriteFiles(next);
  return next;
}

export function removeFavouriteFile(path: string): string[] {
  const next = loadFavouriteFiles().filter((entry) => entry !== path);
  saveFavouriteFiles(next);
  return next;
}
