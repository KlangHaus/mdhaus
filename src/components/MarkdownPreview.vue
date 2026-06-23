<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { renderMarkdown } from "../lib/markdown";

const props = defineProps<{
  source: string;
}>();

const html = ref("");
const loading = ref(false);

const isEmpty = computed(() => props.source.trim().length === 0);

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
</script>

<template>
  <section class="markdown-preview">
    <p v-if="isEmpty" class="placeholder text-secondary">Preview appears here as you type…</p>
    <p v-else-if="loading" class="placeholder text-secondary">Rendering…</p>
    <article v-else class="container-prose prose" v-html="html" />
  </section>
</template>

<style scoped lang="scss">
.markdown-preview {
  height: 100%;
  overflow: auto;
  padding: 16px 24px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #111118);
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
</style>
