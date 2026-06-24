import { readonly, ref } from "vue";
import {
  clampEditorFontSize,
  loadEditorFontSize,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  saveEditorFontSize,
} from "../types/editorFontSize";

const fontSize = ref(loadEditorFontSize());

export function useEditorFontSize() {
  function setFontSize(size: number) {
    const next = clampEditorFontSize(size);
    fontSize.value = next;
    saveEditorFontSize(next);
  }

  function increaseFontSize() {
    if (fontSize.value >= MAX_EDITOR_FONT_SIZE) {
      return;
    }

    setFontSize(fontSize.value + 1);
  }

  function decreaseFontSize() {
    if (fontSize.value <= MIN_EDITOR_FONT_SIZE) {
      return;
    }

    setFontSize(fontSize.value - 1);
  }

  return {
    fontSize: readonly(fontSize),
    minFontSize: MIN_EDITOR_FONT_SIZE,
    maxFontSize: MAX_EDITOR_FONT_SIZE,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
  };
}
