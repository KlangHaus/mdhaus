export interface DocumentStats {
  words: number;
  characters: number;
  readingMinutes: number;
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function getDocumentStats(text: string): DocumentStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const characters = text.length;
  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

  return { words, characters, readingMinutes };
}

export function formatDocumentStats(stats: DocumentStats, t: TranslateFn): string {
  if (stats.words === 0) {
    return t("stats.wordsZero");
  }

  return `${t("stats.words", { count: stats.words })} · ${t("stats.reading", { minutes: stats.readingMinutes })}`;
}
