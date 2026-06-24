export const EDITOR_FONT_SIZE_STORAGE_KEY = "open-mdhaus-editor-font-size";
export const DEFAULT_EDITOR_FONT_SIZE = 14;
export const MIN_EDITOR_FONT_SIZE = 12;
export const MAX_EDITOR_FONT_SIZE = 24;

export function clampEditorFontSize(size: number): number {
  return Math.min(MAX_EDITOR_FONT_SIZE, Math.max(MIN_EDITOR_FONT_SIZE, Math.round(size)));
}

export function loadEditorFontSize(): number {
  const stored = localStorage.getItem(EDITOR_FONT_SIZE_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_EDITOR_FONT_SIZE;
  }

  const parsed = Number.parseInt(stored, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_EDITOR_FONT_SIZE;
  }

  return clampEditorFontSize(parsed);
}

export function saveEditorFontSize(size: number) {
  localStorage.setItem(EDITOR_FONT_SIZE_STORAGE_KEY, String(clampEditorFontSize(size)));
}
