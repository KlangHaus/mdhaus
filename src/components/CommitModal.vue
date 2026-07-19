<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { GTButton } from "@grundtone/vue";
import { buildDefaultCommitMessage, normalizeDocsCommitMessage } from "../lib/gitCommitMessage";
import { useI18n } from "../i18n/useI18n";

export interface CommitConfirmPayload {
  message: string;
  files: string[];
}

const props = defineProps<{
  open: boolean;
  workspaceLabel: string;
  files: string[];
  committing: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [payload: CommitConfirmPayload];
}>();

const { t } = useI18n();
const message = ref("");
const selectedFiles = ref<Record<string, boolean>>({});

const selectedFileList = computed(() =>
  props.files.filter((file) => selectedFiles.value[file] === true),
);

const allSelected = computed(
  () => props.files.length > 0 && selectedFileList.value.length === props.files.length,
);

const scopeName = computed(() => {
  if (selectedFileList.value.length === 1) {
    const path = selectedFileList.value[0] ?? "";
    const parts = path.split("/");
    return parts[parts.length - 1] ?? path;
  }

  return props.workspaceLabel;
});

watch(
  () => [props.open, props.files] as const,
  ([isOpen, files]) => {
    if (!isOpen) {
      return;
    }

    const nextSelection: Record<string, boolean> = {};
    for (const file of files) {
      nextSelection[file] = true;
    }
    selectedFiles.value = nextSelection;
    message.value = buildDefaultCommitMessage(scopeName.value, files.length);
  },
);

watch(selectedFileList, (files) => {
  if (!props.open) {
    return;
  }

  message.value = buildDefaultCommitMessage(scopeName.value, files.length);
});

function toggleFile(file: string, checked: boolean) {
  selectedFiles.value = {
    ...selectedFiles.value,
    [file]: checked,
  };
}

function selectAll() {
  const nextSelection: Record<string, boolean> = {};
  for (const file of props.files) {
    nextSelection[file] = true;
  }
  selectedFiles.value = nextSelection;
}

function deselectAll() {
  const nextSelection: Record<string, boolean> = {};
  for (const file of props.files) {
    nextSelection[file] = false;
  }
  selectedFiles.value = nextSelection;
}

function onSubmit() {
  const normalized = normalizeDocsCommitMessage(message.value);
  if (normalized.length === 0 || props.committing || selectedFileList.value.length === 0) {
    return;
  }

  emit("confirm", {
    message: normalized,
    files: selectedFileList.value,
  });
}
</script>

<template>
  <div v-if="open" class="commit-modal" role="dialog" aria-modal="true" :aria-label="t('git.commitTitle')">
    <button type="button" class="commit-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <form class="commit-modal__panel bg-surface-raised border rounded-md" @submit.prevent="onSubmit">
      <header class="commit-modal__header p-4 border-b">
        <h2 class="text-base font-bold m-0">{{ t("git.commitTitle") }}</h2>
        <p class="text-secondary text-sm m-0 mt-1">{{ workspaceLabel }}</p>
      </header>

      <div class="commit-modal__body p-4">
        <section class="commit-modal__section">
          <div class="commit-modal__section-header">
            <h3 class="commit-modal__section-title">
              {{ t("git.commitFilesLabel", { count: selectedFileList.length }) }}
            </h3>
            <div v-if="files.length > 0" class="commit-modal__selection-actions">
              <button type="button" class="commit-modal__link" :disabled="allSelected" @click="selectAll">
                {{ t("git.commitSelectAll") }}
              </button>
              <button type="button" class="commit-modal__link" :disabled="selectedFileList.length === 0" @click="deselectAll">
                {{ t("git.commitDeselectAll") }}
              </button>
            </div>
          </div>

          <p v-if="files.length === 0" class="text-secondary text-sm m-0">{{ t("git.commitNoChanges") }}</p>
          <ul v-else class="commit-modal__files">
            <li v-for="file in files" :key="file" class="commit-modal__file">
              <label class="commit-modal__file-label">
                <input
                  type="checkbox"
                  :checked="selectedFiles[file] === true"
                  :disabled="committing"
                  @change="toggleFile(file, ($event.target as HTMLInputElement).checked)"
                />
                <span class="commit-modal__file-path">{{ file }}</span>
              </label>
            </li>
          </ul>
          <p v-if="files.length > 0 && selectedFileList.length === 0" class="commit-modal__warning text-sm m-0 mt-2">
            {{ t("git.commitNoFilesSelected") }}
          </p>
        </section>

        <label class="commit-modal__label text-sm font-semibold" for="commit-message">
          {{ t("git.commitMessageLabel") }}
        </label>
        <textarea
          id="commit-message"
          v-model="message"
          class="commit-modal__input"
          rows="4"
          :placeholder="t('git.commitMessagePlaceholder')"
          :disabled="committing"
        />
        <p class="commit-modal__hint text-secondary text-xs m-0 mt-2">{{ t("git.commitMessageHint") }}</p>
      </div>

      <footer class="commit-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton size="sm" variant="outlined" type="button" :disabled="committing" @click="emit('close')">
          {{ t("modals.close") }}
        </GTButton>
        <GTButton
          size="sm"
          variant="primary"
          type="submit"
          :disabled="committing || message.trim().length === 0 || selectedFileList.length === 0"
        >
          {{ committing ? t("git.committing") : t("git.commitConfirm") }}
        </GTButton>
      </footer>
    </form>
  </div>
</template>

<style scoped lang="scss">
.commit-modal {
  position: fixed;
  inset: 0;
  z-index: 48;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.commit-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.commit-modal__panel {
  position: relative;
  width: min(36rem, 100%);
  max-height: min(80vh, 40rem);
  display: flex;
  flex-direction: column;
  border-color: var(--color-border-light, #e4e4ec);
}

.commit-modal__header,
.commit-modal__footer {
  border-color: var(--color-border-light, #e4e4ec);
}

.commit-modal__body {
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.commit-modal__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.commit-modal__section-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #5c5c6f);
}

.commit-modal__selection-actions {
  display: flex;
  gap: 0.5rem;
}

.commit-modal__link {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.75rem;
  color: var(--color-primary, #5b4cdb);
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

.commit-modal__files {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 10rem;
  overflow: auto;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 8px;
}

.commit-modal__file {
  border-bottom: 1px solid var(--color-border-light, #e4e4ec);

  &:last-child {
    border-bottom: none;
  }
}

.commit-modal__file-label {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.45rem 0.65rem;
  cursor: pointer;
}

.commit-modal__file-path {
  font-family: var(--font-family-mono, ui-monospace, monospace);
  font-size: 0.78rem;
  line-height: 1.35;
  word-break: break-word;
}

.commit-modal__warning {
  color: #b42318;
}

.commit-modal__label {
  display: block;
  margin-bottom: 0.45rem;
}

.commit-modal__input {
  width: 100%;
  min-height: 6rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  font: inherit;
  line-height: 1.45;
  resize: vertical;
  background: var(--color-surface, #fff);
  color: var(--color-text, #111118);
}
</style>
