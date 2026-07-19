<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { useEditorFontSize } from "../composables/useEditorFontSize";
import { createEditorTheme } from "../lib/editorTheme";
import { getScrollRatio, setScrollRatio } from "../lib/scrollSync";

const { fontSize } = useEditorFontSize();
const themeCompartment = new Compartment();
const editabilityCompartment = new Compartment();
const spellcheckCompartment = new Compartment();

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    spellcheck?: boolean;
  }>(),
  {
    spellcheck: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  scroll: [ratio: number];
  "image-drop": [file: File];
}>();

const host = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let ignoreNextScroll = false;
let scrollCleanup: (() => void) | undefined;

function applyScrollRatio(ratio: number) {
  if (!view) {
    return;
  }

  ignoreNextScroll = true;
  setScrollRatio(view.scrollDOM, ratio);
}

function onScrollerScroll() {
  if (!view || ignoreNextScroll) {
    ignoreNextScroll = false;
    return;
  }

  emit("scroll", getScrollRatio(view.scrollDOM));
}

function insertTextAtCursor(text: string) {
  if (!view || props.readonly) {
    return;
  }

  const selection = view.state.selection.main;
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: text },
    selection: { anchor: selection.from + text.length },
  });
  view.focus();
}

function onDragOver(event: DragEvent) {
  if (props.readonly) {
    return;
  }

  event.preventDefault();
}

function onDrop(event: DragEvent) {
  if (props.readonly) {
    return;
  }

  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  emit("image-drop", file);
}

defineExpose({
  setScrollRatio: applyScrollRatio,
  insertTextAtCursor,
  openSearch() {
    if (!view || props.readonly) {
      return;
    }

    openSearchPanel(view);
  },
  scrollToLine(lineNumber: number) {
    if (!view) {
      return;
    }

    const doc = view.state.doc;
    const clamped = Math.min(Math.max(1, lineNumber), doc.lines);
    const line = doc.line(clamped);

    ignoreNextScroll = true;
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: "start", yMargin: 24 }),
      selection: { anchor: line.from },
    });
    view.focus();
  },
});

onMounted(() => {
  if (!host.value) {
    return;
  }

  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        search({ top: true }),
        keymap.of([...searchKeymap, ...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        editabilityCompartment.of([
          EditorState.readOnly.of(!!props.readonly),
          EditorView.editable.of(!props.readonly),
        ]),
        spellcheckCompartment.of(
          EditorView.contentAttributes.of({
            spellcheck: props.spellcheck ? "true" : "false",
          }),
        ),
        themeCompartment.of(createEditorTheme(fontSize.value)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit("update:modelValue", update.state.doc.toString());
          }
        }),
      ],
    }),
  });

  const scroller = view.scrollDOM;
  scroller.addEventListener("scroll", onScrollerScroll, { passive: true });
  scrollCleanup = () => scroller.removeEventListener("scroll", onScrollerScroll);
});

watch(
  () => props.modelValue,
  (value) => {
    if (!view) {
      return;
    }

    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  },
);

watch(fontSize, (size) => {
  if (!view) {
    return;
  }

  view.dispatch({
    effects: themeCompartment.reconfigure(createEditorTheme(size)),
  });
});

watch(
  () => props.readonly,
  (readonly) => {
    if (!view) {
      return;
    }

    view.dispatch({
      effects: editabilityCompartment.reconfigure([
        EditorState.readOnly.of(!!readonly),
        EditorView.editable.of(!readonly),
      ]),
    });
  },
);

watch(
  () => props.spellcheck,
  (enabled) => {
    if (!view) {
      return;
    }

    view.dispatch({
      effects: spellcheckCompartment.reconfigure(
        EditorView.contentAttributes.of({
          spellcheck: enabled ? "true" : "false",
        }),
      ),
    });
  },
);

onBeforeUnmount(() => {
  scrollCleanup?.();
  scrollCleanup = undefined;
  view?.destroy();
  view = null;
});
</script>

<template>
  <div
    ref="host"
    class="markdown-editor"
    @dragover="onDragOver"
    @drop="onDrop"
  />
</template>

<style scoped lang="scss">
.markdown-editor {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface-raised, #ffffff);
  color: var(--color-text, #111118);
}

.markdown-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
