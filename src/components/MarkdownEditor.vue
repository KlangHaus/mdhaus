<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { createEditorTheme } from "../lib/editorTheme";
import { getScrollRatio, setScrollRatio } from "../lib/scrollSync";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  scroll: [ratio: number];
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

defineExpose({
  setScrollRatio: applyScrollRatio,
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
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        createEditorTheme(),
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

onBeforeUnmount(() => {
  scrollCleanup?.();
  scrollCleanup = undefined;
  view?.destroy();
  view = null;
});
</script>

<template>
  <div ref="host" class="markdown-editor" />
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
