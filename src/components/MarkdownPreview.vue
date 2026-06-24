<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { renderMarkdown } from "../lib/markdown";
import { extractHeadings } from "../lib/headings";
import { getScrollRatio, setScrollRatio } from "../lib/scrollSync";
import { useI18n } from "../i18n/useI18n";

const props = defineProps<{
  source: string;
}>();

const emit = defineEmits<{
  scroll: [ratio: number];
}>();

const { t } = useI18n();

const html = ref("");
const loading = ref(false);
const articleRef = ref<HTMLElement | null>(null);
const previewRef = ref<HTMLElement | null>(null);
let ignoreNextScroll = false;

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
});

onMounted(() => {
  previewRef.value?.addEventListener("scroll", onPreviewScroll, { passive: true });
});

onBeforeUnmount(() => {
  previewRef.value?.removeEventListener("scroll", onPreviewScroll);
});

watch(
  () => props.source,
  async (source) => {
    loading.value = true;
    try {
      html.value = await renderMarkdown(source);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function scrollToHeading(id: string) {
  nextTick(() => {
    articleRef.value?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
</script>

<template>
  <section ref="previewRef" class="markdown-preview">
    <p v-if="isEmpty" class="placeholder text-secondary">{{ t("preview.empty") }}</p>
    <p v-else-if="loading" class="placeholder text-secondary">{{ t("preview.rendering") }}</p>
    <div v-else class="markdown-preview__layout">
      <nav v-if="headings.length > 0" class="markdown-preview__toc" :aria-label="t('preview.tocTitle')">
        <h3 class="markdown-preview__toc-title">{{ t("preview.tocTitle") }}</h3>
        <ul class="markdown-preview__toc-list">
          <li
            v-for="heading in headings"
            :key="heading.id"
            class="markdown-preview__toc-item"
            :style="{ paddingLeft: `${(heading.level - 1) * 0.65}rem` }"
          >
            <button type="button" class="markdown-preview__toc-link" @click="scrollToHeading(heading.id)">
              {{ heading.text }}
            </button>
          </li>
        </ul>
      </nav>

      <article ref="articleRef" class="container-prose prose markdown-preview__article" v-html="html" />
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
  gap: 1.25rem;
  align-items: start;
}

.markdown-preview__toc {
  position: sticky;
  top: 0;
}

.markdown-preview__toc-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary, #5c5c6f);
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
  min-width: 0;
}

.placeholder {
  margin: 0;
  font-size: 0.95rem;
}

.markdown-preview :deep(ul.contains-task-list) {
  list-style: none;
  padding-left: 0.25rem;
}

.markdown-preview :deep(li.task-list-item) {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.markdown-preview :deep(.task-list-checkbox) {
  margin-top: 0.2rem;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: var(--color-primary, #5b4cdb);
}

.markdown-preview :deep(.markdown-table) {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border-light, #e4e4ec);
}

.markdown-preview :deep(.markdown-table__head),
.markdown-preview :deep(.markdown-table__cell) {
  border: 1px solid var(--color-border-light, #e4e4ec);
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}

.markdown-preview :deep(.markdown-table__head) {
  background: var(--color-surface-alt, #f4f4f8);
  font-weight: 600;
}

.markdown-preview :deep(.markdown-table tbody tr:nth-child(even)) {
  background: color-mix(in srgb, var(--color-surface-alt, #f4f4f8) 55%, transparent);
}

@media (max-width: 900px) {
  .markdown-preview__layout {
    grid-template-columns: 1fr;
  }

  .markdown-preview__toc {
    position: static;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-light, #e4e4ec);
  }
}
</style>
