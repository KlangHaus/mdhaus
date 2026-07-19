<script setup lang="ts">
import { ref, watch } from "vue";
import { GTButton } from "@grundtone/vue";
import { FILE_TEMPLATE_IDS, type FileTemplateId } from "../lib/fileTemplates";
import { useI18n } from "../i18n/useI18n";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [templateId: FileTemplateId];
}>();

const { t } = useI18n();
const selected = ref<FileTemplateId>("blank");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selected.value = "blank";
    }
  },
);

function submit() {
  emit("confirm", selected.value);
}
</script>

<template>
  <div v-if="open" class="new-file-modal" role="dialog" aria-modal="true" :aria-label="t('files.newFileTitle')">
    <button type="button" class="new-file-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <form class="new-file-modal__panel bg-surface-raised border rounded-md" @submit.prevent="submit">
      <header class="new-file-modal__header p-4 border-b">
        <h2 class="text-base font-bold m-0">{{ t("files.newFileTitle") }}</h2>
        <p class="text-secondary text-sm m-0 mt-1">{{ t("files.newFileHint") }}</p>
      </header>

      <div class="new-file-modal__body p-4">
        <ul class="new-file-modal__list">
          <li v-for="templateId in FILE_TEMPLATE_IDS" :key="templateId">
            <label class="new-file-modal__option">
              <input v-model="selected" type="radio" name="file-template" :value="templateId" />
              <span class="new-file-modal__option-copy">
                <span class="new-file-modal__option-title">{{ t(`files.templates.${templateId}.label`) }}</span>
                <span class="new-file-modal__option-desc text-secondary">
                  {{ t(`files.templates.${templateId}.description`) }}
                </span>
              </span>
            </label>
          </li>
        </ul>
      </div>

      <footer class="new-file-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton size="sm" variant="outlined" type="button" @click="emit('close')">{{ t("modals.close") }}</GTButton>
        <GTButton size="sm" variant="primary" type="submit">{{ t("files.newFileConfirm") }}</GTButton>
      </footer>
    </form>
  </div>
</template>

<style scoped lang="scss">
.new-file-modal {
  position: fixed;
  inset: 0;
  z-index: 46;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.new-file-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.new-file-modal__panel {
  position: relative;
  width: min(28rem, 100%);
  border-color: var(--color-border-light, #e4e4ec);
  box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
}

.new-file-modal__header,
.new-file-modal__footer {
  border-color: var(--color-border-light, #e4e4ec);
}

.new-file-modal__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.new-file-modal__option {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 8px;
  cursor: pointer;

  &:has(input:checked) {
    border-color: color-mix(in srgb, var(--color-primary, #5b4cdb) 45%, var(--color-border-light, #e4e4ec));
    background: color-mix(in srgb, var(--color-primary, #5b4cdb) 6%, var(--color-surface, #fff));
  }
}

.new-file-modal__option-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.new-file-modal__option-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.new-file-modal__option-desc {
  font-size: 0.8rem;
  line-height: 1.35;
}
</style>
