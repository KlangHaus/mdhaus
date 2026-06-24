<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { GTButton } from "@grundtone/vue";
import { useI18n } from "../i18n/useI18n";

const props = defineProps<{
  open: boolean;
  defaultName: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [name: string];
}>();

const { t } = useI18n();
const nameInput = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => [props.open, props.defaultName] as const,
  async ([open, defaultName]) => {
    if (!open) {
      return;
    }

    nameInput.value = defaultName;
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  },
);

function submit() {
  const trimmed = nameInput.value.trim();
  if (trimmed.length === 0) {
    return;
  }

  emit("confirm", trimmed);
}
</script>

<template>
  <div
    v-if="open"
    class="create-folder-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-folder-title"
  >
    <button type="button" class="create-folder-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <form class="create-folder-modal__panel bg-surface-raised border rounded-md" @submit.prevent="submit">
      <header class="create-folder-modal__header p-4 border-b">
        <h2 id="create-folder-title" class="text-base font-bold m-0">{{ t("files.createFolderTitle") }}</h2>
      </header>

      <div class="create-folder-modal__body p-4">
        <label class="create-folder-modal__label text-sm font-semibold" for="create-folder-input">
          {{ t("files.createFolderLabel") }}
        </label>
        <input
          id="create-folder-input"
          ref="inputRef"
          v-model="nameInput"
          type="text"
          class="create-folder-modal__input"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <footer class="create-folder-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton size="sm" variant="outlined" type="button" @click="emit('close')">{{ t("modals.close") }}</GTButton>
        <GTButton size="sm" variant="primary" type="submit">{{ t("files.createFolderConfirm") }}</GTButton>
      </footer>
    </form>
  </div>
</template>

<style scoped lang="scss">
.create-folder-modal {
  position: fixed;
  inset: 0;
  z-index: 46;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.create-folder-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.create-folder-modal__panel {
  position: relative;
  width: min(24rem, 100%);
  border-color: var(--color-border-light, #e4e4ec);
  box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
}

.create-folder-modal__header,
.create-folder-modal__footer {
  border-color: var(--color-border-light, #e4e4ec);
}

.create-folder-modal__label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text, #111118);
}

.create-folder-modal__input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #111118);
  font-size: 0.875rem;

  &:focus {
    outline: 2px solid color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, transparent);
    outline-offset: 1px;
  }
}
</style>
