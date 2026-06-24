<script setup lang="ts">
import { computed } from "vue";
import { useEditorFontSize } from "../composables/useEditorFontSize";
import { useI18n } from "../i18n/useI18n";

const { t } = useI18n();
const { fontSize, minFontSize, maxFontSize, increaseFontSize, decreaseFontSize } = useEditorFontSize();

const canDecrease = computed(() => fontSize.value > minFontSize);
const canIncrease = computed(() => fontSize.value < maxFontSize);
</script>

<template>
  <div class="editor-font-size" :aria-label="t('toolbar.fontSize')">
    <button
      type="button"
      class="editor-font-size__button"
      :disabled="!canDecrease"
      :aria-label="t('toolbar.decreaseFontSize')"
      :title="t('toolbar.decreaseFontSize')"
      @click="decreaseFontSize"
    >
      A−
    </button>
    <span class="editor-font-size__value" :title="t('toolbar.fontSize')">{{ fontSize }}px</span>
    <button
      type="button"
      class="editor-font-size__button"
      :disabled="!canIncrease"
      :aria-label="t('toolbar.increaseFontSize')"
      :title="t('toolbar.increaseFontSize')"
      @click="increaseFontSize"
    >
      A+
    </button>
  </div>
</template>

<style scoped lang="scss">
.editor-font-size {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0 0.15rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
}

.editor-font-size__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary, #5c5c6f);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--color-primary, #5b4cdb);
    background: color-mix(in srgb, var(--color-primary, #5b4cdb) 8%, transparent);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.editor-font-size__value {
  min-width: 2.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text, #111118);
}
</style>
