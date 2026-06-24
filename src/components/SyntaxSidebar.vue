<script setup lang="ts">
import { computed } from "vue";
import { GTButton, GTIcon } from "@grundtone/vue";
import { useI18n } from "../i18n/useI18n";
import MarkdownGuide from "./MarkdownGuide.vue";

const open = defineModel<boolean>("open", { default: false });
const { t } = useI18n();

const toggleLabel = computed(() => (open.value ? t("syntax.toggleHide") : t("syntax.toggleShow")));
const toggleIcon = computed(() => (open.value ? "chevron-right" : "chevron-left"));

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <aside
    id="syntax-sidebar-panel"
    class="syntax-aside cq-sidebar border-l bg-surface-raised flex flex-col min-h-0"
    :class="open ? 'sidebar-expanded syntax-aside--open' : 'sidebar-collapsed syntax-aside--closed'"
    :aria-expanded="open"
  >
    <header class="syntax-aside__header flex items-center gap-2 p-3 border-b">
      <GTButton
        size="sm"
        variant="unstyled"
        class="syntax-aside__toggle"
        :aria-label="toggleLabel"
        @click="toggle"
      >
        <GTIcon :name="toggleIcon" size="sm" class="sidebar-icon" />
        <span class="sidebar-text text-sm font-semibold">{{ t("syntax.label") }}</span>
      </GTButton>

      <h2 v-if="open" class="syntax-aside__title sidebar-text text-sm font-bold m-0 flex-1">
        {{ t("syntax.title") }}
      </h2>

      <GTButton
        v-if="open"
        size="sm"
        variant="unstyled"
        :aria-label="t('syntax.close')"
        @click="open = false"
      >
        <GTIcon name="chevron-right" size="sm" />
      </GTButton>
    </header>

    <div v-show="open" class="syntax-aside__body flex-1 min-h-0 overflow-hidden">
      <MarkdownGuide :show-header="false" />
    </div>
  </aside>
</template>

<style scoped lang="scss">
.syntax-aside {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 20;
  width: 3rem;
  transition: width 220ms ease;
  overflow: hidden;
  flex-shrink: 0;
}

.syntax-aside--open {
  width: 20rem;
}

.syntax-aside__header {
  border-color: var(--color-border-light, #e4e4ec);
  min-height: 3rem;
}

.syntax-aside--closed .syntax-aside__header {
  justify-content: center;
  padding-inline: 0.5rem;
}

.syntax-aside__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.syntax-aside--closed .syntax-aside__toggle {
  justify-content: center;
  width: 100%;
}

.syntax-aside__title {
  color: var(--color-text, #111118);
}

.syntax-aside__body {
  border-top: 1px solid var(--color-border-light, #e4e4ec);
}
</style>
