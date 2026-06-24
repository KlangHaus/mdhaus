<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { PaneLayout } from "../types/layout";
import { useI18n } from "../i18n/useI18n";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    layout?: PaneLayout;
    initialRatio?: number;
    minPane?: number;
  }>(),
  {
    layout: "split",
    initialRatio: 0.5,
    minPane: 200,
  },
);

const container = ref<HTMLElement | null>(null);
const ratio = ref(props.initialRatio);
const dragging = ref(false);

const showEditor = computed(() => props.layout !== "preview");
const showPreview = computed(() => props.layout !== "editor");
const showDivider = computed(() => props.layout === "split");

const editorStyle = computed(() => {
  if (props.layout === "editor") {
    return { width: "100%" };
  }

  if (props.layout === "split") {
    return { width: `${ratio.value * 100}%` };
  }

  return undefined;
});

function onPointerDown(event: PointerEvent) {
  dragging.value = true;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || !container.value || props.layout !== "split") {
    return;
  }

  const rect = container.value.getBoundingClientRect();
  const next = (event.clientX - rect.left) / rect.width;
  const minRatio = props.minPane / rect.width;
  const maxRatio = 1 - minRatio;
  ratio.value = Math.min(maxRatio, Math.max(minRatio, next));
}

function onPointerUp() {
  dragging.value = false;
}

onMounted(() => {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
});
</script>

<template>
  <div
    ref="container"
    class="split-pane"
    :class="{
      'split-pane--dragging': dragging,
      [`split-pane--${layout}`]: true,
    }"
  >
    <div v-show="showEditor" class="split-pane__left" :style="editorStyle">
      <slot name="left" />
    </div>
    <div
      v-if="showDivider"
      class="split-pane__divider"
      role="separator"
      aria-orientation="vertical"
      :aria-label="t('splitPane.resize')"
      @pointerdown="onPointerDown"
    />
    <div v-show="showPreview" class="split-pane__right" :class="{ 'split-pane__right--solo': layout !== 'split' }">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.split-pane {
  display: flex;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;

  &--dragging {
    cursor: col-resize;
    user-select: none;
  }
}

.split-pane__left {
  flex-shrink: 0;
  min-width: 200px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.split-pane--editor .split-pane__left {
  min-width: 0;
  flex: 1 1 100%;
}

.split-pane__divider {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: var(--color-border-medium, #d0d0dc);
  transition: background 120ms ease;

  &:hover,
  .split-pane--dragging & {
    background: var(--color-primary, #6c5ce7);
  }
}

.split-pane__right {
  flex: 1;
  min-width: 200px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.split-pane__right--solo {
  min-width: 0;
  flex: 1 1 100%;
  width: 100%;
}
</style>
