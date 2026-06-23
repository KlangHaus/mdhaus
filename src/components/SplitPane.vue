<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    initialRatio?: number;
    minPane?: number;
  }>(),
  {
    initialRatio: 0.5,
    minPane: 200,
  },
);

const container = ref<HTMLElement | null>(null);
const ratio = ref(props.initialRatio);
const dragging = ref(false);

function onPointerDown(event: PointerEvent) {
  dragging.value = true;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || !container.value) {
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
  <div ref="container" class="split-pane" :class="{ 'split-pane--dragging': dragging }">
    <div class="split-pane__left" :style="{ width: `${ratio * 100}%` }">
      <slot name="left" />
    </div>
    <div
      class="split-pane__divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      @pointerdown="onPointerDown"
    />
    <div class="split-pane__right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.split-pane {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;

  &--dragging {
    cursor: col-resize;
    user-select: none;
  }
}

.split-pane__left {
  flex-shrink: 0;
  min-width: 200px;
  overflow: hidden;
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
  overflow: hidden;
}
</style>
