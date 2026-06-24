<script setup lang="ts">
import { computed } from "vue";
import { GTButton } from "@grundtone/vue";
import { useI18n } from "../i18n/useI18n";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  "show-shortcuts": [];
}>();

const { t, instructionSections } = useI18n();
const sections = computed(() => instructionSections());
</script>

<template>
  <div v-if="open" class="instructions-modal" role="dialog" aria-modal="true" aria-labelledby="instructions-title">
    <button type="button" class="instructions-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <section class="instructions-modal__panel bg-surface-raised border rounded-md">
      <header class="instructions-modal__header flex items-center justify-between gap-3 p-4 border-b">
        <h2 id="instructions-title" class="text-base font-bold m-0">{{ t("modals.instructionsTitle") }}</h2>
        <GTButton size="sm" variant="outlined" @click="emit('close')">{{ t("modals.close") }}</GTButton>
      </header>

      <div class="instructions-modal__body p-4">
        <p class="instructions-modal__intro text-secondary m-0 mb-4">
          {{ t("modals.instructionsIntro") }}
        </p>

        <section
          v-for="section in sections"
          :key="section.title"
          class="instructions-modal__group"
        >
          <h3 class="instructions-modal__group-title text-sm font-semibold m-0 mb-2">{{ section.title }}</h3>
          <ul class="instructions-modal__list">
            <li v-for="(item, index) in section.items" :key="index" class="instructions-modal__item text-secondary">
              {{ item }}
            </li>
          </ul>
        </section>

        <div class="instructions-modal__footer">
          <GTButton size="sm" variant="secondary" @click="emit('show-shortcuts')">
            {{ t("modals.showShortcuts") }}
          </GTButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.instructions-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.instructions-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 35%);
  cursor: pointer;
}

.instructions-modal__panel {
  position: relative;
  width: min(36rem, 100%);
  max-height: min(85vh, 44rem);
  overflow: auto;
  border-color: var(--color-border-light, #e4e4ec);
  box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
}

.instructions-modal__header {
  border-color: var(--color-border-light, #e4e4ec);
}

.instructions-modal__intro {
  font-size: 0.9rem;
  line-height: 1.5;
}

.instructions-modal__group + .instructions-modal__group {
  margin-top: 1.25rem;
}

.instructions-modal__list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.instructions-modal__item {
  font-size: 0.875rem;
  line-height: 1.45;
}

.instructions-modal__footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light, #e4e4ec);
}
</style>
