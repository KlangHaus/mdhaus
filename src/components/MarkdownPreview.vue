<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useTheme } from "@grundtone/vue";
import { renderMarkdown } from "../lib/markdown";
import { extractHeadings } from "../lib/headings";
import { renderMermaidBlocks, resetMermaidTheme } from "../lib/mermaidRender";
import { getScrollRatio, setScrollRatio } from "../lib/scrollSync";
import { TOC_SIDEBAR_OPEN_KEY, loadSidebarOpen, saveSidebarOpen } from "../types/sidebar";
import { useI18n } from "../i18n/useI18n";

const props = defineProps<{
  source: string;
  workspaceFiles: string[];
  currentFilePath: string | null;
}>();

const emit = defineEmits<{
  scroll: [ratio: number];
  "heading-click": [id: string];
  "wikilink-click": [payload: { path: string; heading: string | null }];
}>();

const { t } = useI18n();
const { mode: themeMode } = useTheme();

const html = ref("");
const loading = ref(false);
const articleRef = ref<HTMLElement | null>(null);
const previewRef = ref<HTMLElement | null>(null);
let ignoreNextScroll = false;

const tocOpen = ref(loadSidebarOpen(TOC_SIDEBAR_OPEN_KEY));

watch(tocOpen, (value) => {
  saveSidebarOpen(TOC_SIDEBAR_OPEN_KEY, value);
});

const isEmpty = computed(() => props.source.trim().length === 0);
const headings = computed(() => extractHeadings(props.source));

function applyScrollRatio(ratio: number) {
  if (!previewRef.value) {
    return;
  }

  ignoreNextScroll = true;
  setScrollRatio(previewRef.value, ratio);
}

function onPreviewScroll() {
  if (!previewRef.value || ignoreNextScroll) {
    ignoreNextScroll = false;
    return;
  }

  emit("scroll", getScrollRatio(previewRef.value));
}

defineExpose({
  setScrollRatio: applyScrollRatio,
  scrollToHeading,
});

onBeforeUnmount(() => {
  previewRef.value?.removeEventListener("scroll", onPreviewScroll);
  colorSchemeMedia?.removeEventListener("change", onVisualThemeChange);
});

let colorSchemeMedia: MediaQueryList | null = null;

async function refreshPreview() {
  loading.value = true;
  try {
    html.value = await renderMarkdown(props.source, {
      workspaceFiles: props.workspaceFiles,
      currentFilePath: props.currentFilePath,
    });
  } finally {
    loading.value = false;
  }

  await nextTick();
  resetMermaidTheme();
  if (articleRef.value) {
    await renderMermaidBlocks(articleRef.value);
  }
}

function onVisualThemeChange() {
  if (props.source.trim().length === 0) {
    return;
  }

  void refreshPreview();
}

watch(
  () => [props.source, props.workspaceFiles, props.currentFilePath] as const,
  () => {
    void refreshPreview();
  },
  { immediate: true },
);

watch(themeMode, () => {
  void refreshPreview();
});

onMounted(() => {
  previewRef.value?.addEventListener("scroll", onPreviewScroll, { passive: true });
  colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  colorSchemeMedia.addEventListener("change", onVisualThemeChange);
});

function scrollToHeading(id: string) {
  nextTick(() => {
    articleRef.value?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function onHeadingActivate(id: string) {
  scrollToHeading(id);
  emit("heading-click", id);
}

function onArticleClick(event: MouseEvent) {
  const wikilink = (event.target as HTMLElement).closest("a.markdown-wikilink");
  if (wikilink && articleRef.value?.contains(wikilink)) {
    event.preventDefault();
    const path = wikilink.getAttribute("data-wikilink-path");
    if (!path) {
      return;
    }

    const heading = wikilink.getAttribute("data-wikilink-heading");
    emit("wikilink-click", { path, heading: heading && heading.length > 0 ? heading : null });
    return;
  }

  const heading = (event.target as HTMLElement).closest("h1, h2, h3, h4, h5, h6");
  if (!heading?.id || !articleRef.value?.contains(heading)) {
    return;
  }

  onHeadingActivate(heading.id);
}
</script>

<template>
  <section ref="previewRef" class="markdown-preview">
    <p v-if="isEmpty" class="placeholder text-secondary">{{ t("preview.empty") }}</p>
    <p v-else-if="loading" class="placeholder text-secondary">{{ t("preview.rendering") }}</p>
    <div
      v-else
      class="markdown-preview__layout"
      :class="{
        'markdown-preview__layout--no-toc': headings.length === 0,
        'markdown-preview__layout--toc-collapsed': headings.length > 0 && !tocOpen,
      }"
    >
      <nav v-if="headings.length > 0 && tocOpen" class="markdown-preview__toc" :aria-label="t('preview.tocTitle')">
        <div class="markdown-preview__toc-header">
          <h3 class="markdown-preview__toc-title">{{ t("preview.tocTitle") }}</h3>
          <button
            type="button"
            class="markdown-preview__toc-toggle"
            :aria-label="t('preview.collapseToc')"
            :title="t('preview.collapseToc')"
            @click="tocOpen = false"
          >
            ‹
          </button>
        </div>
        <ul class="markdown-preview__toc-list">
          <li
            v-for="heading in headings"
            :key="heading.id"
            class="markdown-preview__toc-item"
            :style="{ paddingLeft: `${(heading.level - 1) * 0.65}rem` }"
          >
            <button type="button" class="markdown-preview__toc-link" @click="onHeadingActivate(heading.id)">
              {{ heading.text }}
            </button>
          </li>
        </ul>
      </nav>

      <button
        v-if="headings.length > 0 && !tocOpen"
        type="button"
        class="markdown-preview__toc-expand"
        :aria-label="t('preview.expandToc')"
        :title="t('preview.expandToc')"
        @click="tocOpen = true"
      >
        ›
      </button>

      <article
        ref="articleRef"
        class="prose markdown-content markdown-preview__article"
        v-html="html"
        @click="onArticleClick"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.markdown-preview {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 16px 24px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #111118);
}

.markdown-preview__layout {
  display: grid;
  grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
  grid-template-areas: "toc article";
  gap: 1.25rem;
  align-items: start;
}

.markdown-preview__layout--no-toc {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "article";
}

.markdown-preview__layout--toc-collapsed {
  grid-template-columns: 2.5rem minmax(0, 1fr);
}

.markdown-preview__toc,
.markdown-preview__toc-expand {
  grid-area: toc;
  min-width: 0;
}

.markdown-preview__toc {
  position: sticky;
  top: 0;
}

.markdown-preview__toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.markdown-preview__toc-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary, #5c5c6f);
}

.markdown-preview__toc-toggle,
.markdown-preview__toc-expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface-raised, #fff);
  color: var(--color-text-secondary, #5c5c6f);
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: var(--color-primary, #5b4cdb);
    border-color: color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, var(--color-border-light, #e4e4ec));
  }
}

.markdown-preview__toc-expand {
  position: sticky;
  top: 0;
  align-self: start;
}

.markdown-preview__toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.markdown-preview__toc-link {
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  text-align: left;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--color-text-secondary, #5c5c6f);
  cursor: pointer;

  &:hover {
    color: var(--color-primary, #5b4cdb);
  }
}

.markdown-preview__article {
  grid-area: article;
  min-width: 0;
  width: 100%;
  max-width: 65ch;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    cursor: pointer;
  }
}

.placeholder {
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 900px) {
  .markdown-preview__layout,
  .markdown-preview__layout--toc-collapsed,
  .markdown-preview__layout--no-toc {
    grid-template-columns: 1fr;
    grid-template-areas:
      "toc"
      "article";
  }

  .markdown-preview__layout--no-toc {
    grid-template-areas: "article";
  }

  .markdown-preview__toc {
    position: static;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-light, #e4e4ec);
  }
}
</style>
