<script setup lang="ts">
import { useI18n } from "../i18n/useI18n";

defineProps<{
  tabs: string[];
  activePath: string | null;
  dirtyPaths: Record<string, boolean>;
}>();

const emit = defineEmits<{
  select: [path: string];
  close: [path: string];
}>();

const { t } = useI18n();

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}
</script>

<template>
  <div v-if="tabs.length > 0" class="file-tabs" role="tablist" :aria-label="t('files.tabs')">
    <div
      v-for="path in tabs"
      :key="path"
      class="file-tabs__tab"
      :class="{ 'file-tabs__tab--active': activePath === path }"
      role="tab"
      :aria-selected="activePath === path"
      :title="path"
    >
      <button type="button" class="file-tabs__label" @click="emit('select', path)">
        <span v-if="dirtyPaths[path]" class="file-tabs__dirty">•</span>
        {{ basename(path) }}
      </button>
      <button
        type="button"
        class="file-tabs__close"
        :aria-label="t('files.closeTab')"
        @click.stop="emit('close', path)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light, #e4e4ec);
  background: var(--color-surface-raised, #fff);
  overflow-x: auto;
}

.file-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  max-width: 12rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: var(--color-surface-alt, #f4f4f8);
}

.file-tabs__tab--active {
  background: var(--color-surface, #fff);
  border-color: var(--color-border-light, #e4e4ec);
  font-weight: 600;
}

.file-tabs__label {
  border: none;
  background: transparent;
  padding: 0.35rem 0.25rem 0.35rem 0.55rem;
  font-size: 0.78rem;
  color: var(--color-text, #111118);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tabs__close {
  border: none;
  background: transparent;
  padding: 0.2rem 0.45rem 0.2rem 0;
  font-size: 0.95rem;
  line-height: 1;
  color: var(--color-text-secondary, #5c5c6f);
  cursor: pointer;

  &:hover {
    color: var(--color-text, #111118);
  }
}

.file-tabs__dirty {
  color: var(--color-primary, #5b4cdb);
  margin-right: 0.15rem;
}
</style>
