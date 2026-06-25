<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "../i18n/useI18n";

defineProps<{
  open: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  favorite: [];
  rename: [];
  delete: [];
  close: [];
}>();

const { t } = useI18n();
const menuRef = ref<HTMLElement | null>(null);

function onDocumentPointerDown(event: PointerEvent) {
  if (!menuRef.value?.contains(event.target as Node)) {
    emit("close");
  }
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("keydown", onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  document.removeEventListener("keydown", onDocumentKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menuRef"
      class="file-context-menu"
      role="menu"
      :style="{ top: `${y}px`, left: `${x}px` }"
    >
      <button type="button" class="file-context-menu__item" role="menuitem" @click="emit('favorite')">
        {{ t("files.favourite") }}
      </button>
      <button type="button" class="file-context-menu__item" role="menuitem" @click="emit('rename')">
        {{ t("files.rename") }}
      </button>
      <button type="button" class="file-context-menu__item file-context-menu__item--danger" role="menuitem" @click="emit('delete')">
        {{ t("files.delete") }}
      </button>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.file-context-menu {
  position: fixed;
  z-index: 50;
  min-width: 9rem;
  padding: 0.25rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 8px;
  background: var(--color-surface-raised, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 14%);
}

.file-context-menu__item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  text-align: left;
  font-size: 0.8125rem;
  color: var(--color-text, #111118);
  cursor: pointer;

  &:hover {
    background: var(--color-surface-alt, #f4f4f8);
  }
}

.file-context-menu__item--danger {
  color: #b42318;

  &:hover {
    background: color-mix(in srgb, #b42318 10%, var(--color-surface-alt, #f4f4f8));
  }
}
</style>
