<script setup lang="ts">
import { computed } from "vue";
import { GTButton } from "@grundtone/vue";
import { useI18n } from "../i18n/useI18n";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t, shortcutGroups } = useI18n();
const groups = computed(() => shortcutGroups());
</script>

<template>
  <div v-if="open" class="shortcuts-modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
    <button type="button" class="shortcuts-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <section class="shortcuts-modal__panel bg-surface-raised border rounded-md">
      <header class="shortcuts-modal__header flex items-center justify-between gap-3 p-4 border-b">
        <h2 id="shortcuts-title" class="text-base font-bold m-0">{{ t("modals.shortcutsTitle") }}</h2>
        <GTButton size="sm" variant="outlined" @click="emit('close')">{{ t("modals.close") }}</GTButton>
      </header>

      <div class="shortcuts-modal__body p-4">
        <section v-for="group in groups" :key="group.title" class="shortcuts-modal__group">
          <h3 class="shortcuts-modal__group-title text-sm font-semibold m-0 mb-2">{{ group.title }}</h3>
          <ul class="shortcuts-modal__list">
            <li v-for="item in group.items" :key="item.keys" class="shortcuts-modal__item">
              <kbd class="shortcuts-modal__keys">{{ item.keys }}</kbd>
              <span class="shortcuts-modal__label text-secondary">{{ item.label }}</span>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.shortcuts-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.shortcuts-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 35%);
  cursor: pointer;
}

.shortcuts-modal__panel {
  position: relative;
  width: min(32rem, 100%);
  max-height: min(80vh, 40rem);
  overflow: auto;
  border-color: var(--color-border-light, #e4e4ec);
  box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
}

.shortcuts-modal__header {
  border-color: var(--color-border-light, #e4e4ec);
}

.shortcuts-modal__group + .shortcuts-modal__group {
  margin-top: 1.25rem;
}

.shortcuts-modal__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.shortcuts-modal__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.shortcuts-modal__keys {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5.5rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface-alt, #f4f4f8);
  font-family: var(--font-family-mono, ui-monospace, Menlo, monospace);
  font-size: 0.75rem;
  color: var(--color-text, #111118);
}

.shortcuts-modal__label {
  font-size: 0.875rem;
}
</style>
