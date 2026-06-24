<script setup lang="ts">
import { GTButton } from "@grundtone/vue";
import type { ExternalChange } from "../types/workspace";
import { useI18n } from "../i18n/useI18n";

defineProps<{
  change: ExternalChange | null;
}>();

const emit = defineEmits<{
  reload: [];
  keep: [];
}>();

const { t } = useI18n();

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}
</script>

<template>
  <div
    v-if="change"
    class="external-change-modal"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="external-change-title"
  >
    <button
      type="button"
      class="external-change-modal__backdrop"
      :aria-label="t('externalChange.keepAria')"
      @click="emit('keep')"
    />

    <section class="external-change-modal__panel bg-surface-raised border rounded-md">
      <header class="external-change-modal__header p-4 border-b">
        <h2 id="external-change-title" class="text-base font-bold m-0">{{ t("externalChange.title") }}</h2>
      </header>

      <div class="external-change-modal__body p-4">
        <p class="external-change-modal__text text-secondary m-0">
          {{ t("externalChange.body", { name: basename(change.path) }) }}
        </p>
        <p class="external-change-modal__hint text-secondary m-0 mt-2">
          {{ t("externalChange.hint") }}
        </p>
      </div>

      <footer class="external-change-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton size="sm" variant="outlined" @click="emit('keep')">{{ t("externalChange.keep") }}</GTButton>
        <GTButton size="sm" variant="primary" @click="emit('reload')">{{ t("externalChange.reload") }}</GTButton>
      </footer>
    </section>
  </div>
</template>

<style scoped lang="scss">
.external-change-modal {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.external-change-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.external-change-modal__panel {
  position: relative;
  width: min(28rem, 100%);
  border-color: var(--color-border-light, #e4e4ec);
  box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
}

.external-change-modal__header,
.external-change-modal__footer {
  border-color: var(--color-border-light, #e4e4ec);
}

.external-change-modal__text,
.external-change-modal__hint {
  font-size: 0.875rem;
  line-height: 1.45;
}
</style>
