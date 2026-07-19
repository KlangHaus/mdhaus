<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { GTButton } from "@grundtone/vue";
import { diffLines } from "../lib/lineDiff";
import { useI18n } from "../i18n/useI18n";

export type DiffCompareMode = "disk" | "head";

const props = defineProps<{
  open: boolean;
  filePath: string | null;
  fileName: string;
  editorContent: string;
  diskContent: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

const compareMode = ref<DiffCompareMode>("disk");
const headContent = ref<string | null>(null);
const headLoading = ref(false);

watch(
  () => [props.open, props.filePath, compareMode.value] as const,
  async ([open, filePath, mode]) => {
    if (!open || mode !== "head" || !filePath) {
      headContent.value = null;
      return;
    }

    headLoading.value = true;
    try {
      headContent.value = await invoke<string | null>("read_file_git_head_content", {
        filePath,
      });
    } catch {
      headContent.value = null;
    } finally {
      headLoading.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      compareMode.value = "disk";
    }
  },
);

const referenceContent = computed(() => {
  if (compareMode.value === "head") {
    return headContent.value ?? "";
  }

  return props.diskContent;
});

const lines = computed(() => diffLines(referenceContent.value, props.editorContent));
const hasChanges = computed(() => lines.value.some((line) => line.kind !== "same"));

const modalTitle = computed(() =>
  compareMode.value === "head" ? t("diff.titleHead") : t("diff.titleDisk"),
);

const emptyMessage = computed(() =>
  compareMode.value === "head" ? t("diff.noChangesHead") : t("diff.noChangesDisk"),
);
</script>

<template>
  <div v-if="open" class="diff-modal" role="dialog" aria-modal="true" :aria-label="modalTitle">
    <button type="button" class="diff-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <section class="diff-modal__panel bg-surface-raised border rounded-md">
      <header class="diff-modal__header p-4 border-b">
        <div class="diff-modal__header-row flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-base font-bold m-0">{{ modalTitle }}</h2>
            <p class="text-secondary text-sm m-0 mt-1">{{ fileName }}</p>
          </div>

          <div class="diff-modal__modes flex gap-1" role="tablist" :aria-label="t('diff.compareMode')">
            <button
              type="button"
              class="diff-modal__mode"
              :class="{ 'diff-modal__mode--active': compareMode === 'disk' }"
              role="tab"
              :aria-selected="compareMode === 'disk'"
              @click="compareMode = 'disk'"
            >
              {{ t("diff.compareDisk") }}
            </button>
            <button
              type="button"
              class="diff-modal__mode"
              :class="{ 'diff-modal__mode--active': compareMode === 'head' }"
              role="tab"
              :aria-selected="compareMode === 'head'"
              @click="compareMode = 'head'"
            >
              {{ t("diff.compareHead") }}
            </button>
          </div>
        </div>
      </header>

      <div class="diff-modal__body p-4">
        <p v-if="headLoading" class="text-secondary text-sm m-0">{{ t("diff.loadingHead") }}</p>
        <p v-else-if="compareMode === 'head' && headContent === null" class="text-secondary text-sm m-0">
          {{ t("diff.noHeadVersion") }}
        </p>
        <p v-else-if="!hasChanges" class="text-secondary text-sm m-0">{{ emptyMessage }}</p>
        <pre v-else class="diff-modal__content"><code><span
          v-for="(line, index) in lines"
          :key="index"
          class="diff-modal__line"
          :class="`diff-modal__line--${line.kind}`"
        >{{ line.kind === "remove" ? "- " : line.kind === "add" ? "+ " : "  " }}{{ line.text }}
</span></code></pre>
      </div>

      <footer class="diff-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton size="sm" variant="outlined" type="button" @click="emit('close')">{{ t("modals.close") }}</GTButton>
      </footer>
    </section>
  </div>
</template>

<style scoped lang="scss">
.diff-modal {
  position: fixed;
  inset: 0;
  z-index: 48;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.diff-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 0.35);
  cursor: pointer;
}

.diff-modal__panel {
  position: relative;
  z-index: 1;
  width: min(56rem, 100%);
  max-height: min(80vh, 42rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.18);
}

.diff-modal__body {
  overflow: auto;
  min-height: 0;
}

.diff-modal__modes {
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 8px;
  padding: 2px;
  background: var(--color-surface, #fff);
}

.diff-modal__mode {
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #5c5c6f);
  font-size: 0.8rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;

  &--active {
    background: var(--color-primary, #5b4cdb);
    color: #fff;
  }
}

.diff-modal__content {
  margin: 0;
  font-family: var(--font-family-mono, ui-monospace, monospace);
  font-size: 0.8rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-modal__line--remove {
  color: #b42318;
  background: rgb(180 35 24 / 0.08);
}

.diff-modal__line--add {
  color: #027a48;
  background: rgb(2 122 72 / 0.08);
}
</style>
