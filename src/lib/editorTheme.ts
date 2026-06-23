import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/** CodeMirror theme synced with Grundtone design tokens. */
export function createEditorTheme(): Extension {
  return EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      fontFamily: "var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      color: "var(--color-text, #111118)",
      backgroundColor: "var(--color-surface-raised, #ffffff)",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit",
      lineHeight: "1.6",
    },
    ".cm-content": {
      padding: "16px 12px",
      minHeight: "100%",
      caretColor: "var(--color-primary, #5b4cdb)",
    },
    ".cm-line": {
      color: "var(--color-text, #111118)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-primary, #5b4cdb)",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "color-mix(in srgb, var(--color-primary, #5b4cdb) 28%, transparent) !important",
    },
    ".cm-gutters": {
      color: "var(--color-text-secondary, #5c5c6f)",
      backgroundColor: "var(--color-surface-alt, #f4f4f8)",
      borderRight: "1px solid var(--color-border-light, #e4e4ec)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--color-surface, #ececf2)",
      color: "var(--color-text, #111118)",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--color-primary, #5b4cdb) 8%, var(--color-surface-raised, #ffffff))",
    },
    ".cm-heading": {
      color: "var(--color-text, #111118)",
      fontWeight: "700",
    },
    ".cm-strong": {
      fontWeight: "700",
    },
    ".cm-link": {
      color: "var(--color-primary, #5b4cdb)",
    },
    ".cm-url": {
      color: "var(--color-text-secondary, #5c5c6f)",
    },
    ".cm-quote": {
      color: "var(--color-text-secondary, #5c5c6f)",
      fontStyle: "italic",
    },
    ".cm-comment": {
      color: "var(--color-text-tertiary, #7a7a8c)",
    },
    ".cm-monospace": {
      fontFamily: "inherit",
      backgroundColor: "var(--color-surface-alt, #f4f4f8)",
      borderRadius: "4px",
    },
  });
}
