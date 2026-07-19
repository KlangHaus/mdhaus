<script setup lang="ts">
import { computed } from "vue";
import { GTButton, GTIcon } from "@grundtone/vue";
import type { TagEntry } from "../lib/tags";
import { useI18n } from "../i18n/useI18n";

const open = defineModel<boolean>("open", { default: false });

defineProps<{
  tags: TagEntry[];
  activeTag: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [tag: string];
  clear: [];
}>();

const { t } = useI18n();

const toggleIcon = computed(() => (open.value ? "chevron-right" : "chevron-left"));
</script>

<template>
  <aside
    class="tags-aside cq-sidebar border-l bg-surface-raised flex flex-col min-h-0"
    :class="open ? 'tags-aside--open' : 'tags-aside--closed'"
    :aria-expanded="open"
  >
    <header class="tags-aside__header flex items-center gap-2 p-3 border-b">
      <GTButton
        size="sm"
        variant="unstyled"
        class="tags-aside__toggle"
        :aria-label="open ? t('tags.hide') : t('tags.show')"
        @click="open = !open"
      >
        <GTIcon :name="toggleIcon" size="sm" class="sidebar-icon" />
        <span class="sidebar-text text-sm font-semibold">{{ t("tags.label") }}</span>
      </GTButton>
    </header>

    <div v-show="open" class="tags-aside__body flex-1 min-h-0 overflow-auto p-3">
      <p v-if="loading" class="text-secondary text-sm m-0">{{ t("tags.loading") }}</p>
      <p v-else-if="tags.length === 0" class="text-secondary text-sm m-0">{{ t("tags.empty") }}</p>
      <template v-else>
        <button
          v-if="activeTag"
          type="button"
          class="tags-aside__clear"
          @click="emit('clear')"
        >
          {{ t("tags.clearFilter") }}
        </button>
        <ul class="tags-aside__list">
          <li v-for="entry in tags" :key="entry.tag">
            <button
              type="button"
              class="tags-aside__item"
              :class="{ 'tags-aside__item--active': activeTag === entry.tag }"
              @click="emit('select', entry.tag)"
            >
              <span class="tags-aside__name">#{{ entry.tag }}</span>
              <span class="tags-aside__count text-secondary">{{ entry.count }}</span>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.tags-aside {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 18;
  width: 3rem;
  transition: width 220ms ease;
  overflow: hidden;
  border-color: var(--color-border-light, #e4e4ec);
}

.tags-aside--open {
  width: 16rem;
}

.tags-aside__header {
  border-color: var(--color-border-light, #e4e4ec);
}

.tags-aside__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.tags-aside__clear {
  width: 100%;
  margin-bottom: 0.5rem;
  border: 1px dashed var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: transparent;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.tags-aside__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tags-aside__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  border-radius: 6px;
  background: transparent;
  padding: 0.4rem 0.45rem;
  text-align: left;
  cursor: pointer;

  &:hover,
  &--active {
    background: color-mix(in srgb, var(--color-primary, #5b4cdb) 8%, transparent);
  }
}

.tags-aside__name {
  font-size: 0.82rem;
  font-weight: 600;
}

.tags-aside__count {
  font-size: 0.75rem;
}
</style>
