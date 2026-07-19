<script setup lang="ts">
import { computed } from "vue";
import { GTButton, GTIcon } from "@grundtone/vue";
import type { BacklinkEntry } from "../lib/backlinks";
import { useI18n } from "../i18n/useI18n";

const open = defineModel<boolean>("open", { default: false });

defineProps<{
  backlinks: BacklinkEntry[];
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [path: string];
}>();

const { t } = useI18n();

const toggleIcon = computed(() => (open.value ? "chevron-right" : "chevron-left"));
</script>

<template>
  <aside
    class="backlinks-aside cq-sidebar border-l bg-surface-raised flex flex-col min-h-0"
    :class="open ? 'backlinks-aside--open' : 'backlinks-aside--closed'"
    :aria-expanded="open"
  >
    <header class="backlinks-aside__header flex items-center gap-2 p-3 border-b">
      <GTButton
        size="sm"
        variant="unstyled"
        class="backlinks-aside__toggle"
        :aria-label="open ? t('backlinks.hide') : t('backlinks.show')"
        @click="open = !open"
      >
        <GTIcon :name="toggleIcon" size="sm" class="sidebar-icon" />
        <span class="sidebar-text text-sm font-semibold">{{ t("backlinks.label") }}</span>
      </GTButton>
    </header>

    <div v-show="open" class="backlinks-aside__body flex-1 min-h-0 overflow-auto p-3">
      <p v-if="loading" class="text-secondary text-sm m-0">{{ t("backlinks.loading") }}</p>
      <p v-else-if="backlinks.length === 0" class="text-secondary text-sm m-0">{{ t("backlinks.empty") }}</p>
      <ul v-else class="backlinks-aside__list">
        <li v-for="entry in backlinks" :key="entry.path">
          <button type="button" class="backlinks-aside__item" :title="entry.path" @click="emit('select', entry.path)">
            <span class="backlinks-aside__name">{{ entry.label }}</span>
            <span class="backlinks-aside__path">{{ entry.path }}</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.backlinks-aside {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 18;
  width: 3rem;
  transition: width 220ms ease;
  overflow: hidden;
  border-color: var(--color-border-light, #e4e4ec);
}

.backlinks-aside--open {
  width: 18rem;
}

.backlinks-aside__header {
  border-color: var(--color-border-light, #e4e4ec);
}

.backlinks-aside__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.backlinks-aside__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.backlinks-aside__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  border: none;
  border-radius: 6px;
  background: transparent;
  padding: 0.4rem 0.45rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--color-primary, #5b4cdb) 8%, transparent);
  }
}

.backlinks-aside__name {
  font-size: 0.82rem;
  font-weight: 600;
}

.backlinks-aside__path {
  font-size: 0.72rem;
  color: var(--color-text-secondary, #5c5c6f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
