<script setup lang="ts">
import { ref } from "vue";
import type { FileTreeNode } from "../types/files";
import { useI18n } from "../i18n/useI18n";
import FileTreeNodeItem from "./FileTreeNode.vue";

const { t } = useI18n();

const props = defineProps<{
  node: FileTreeNode;
  depth: number;
  activePath: string | null;
  loadingPath: string | null;
  dirtyPaths: Record<string, boolean>;
  changedPaths: Record<string, boolean>;
  favouritePaths: Record<string, boolean>;
}>();

const emit = defineEmits<{
  select: [path: string];
  "file-context": [payload: { path: string; x: number; y: number }];
  "toggle-favourite": [path: string];
}>();

const expanded = ref(props.depth < 2);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function selectFile() {
  if (props.node.kind === "file") {
    emit("select", props.node.path);
  }
}

function onFileContextMenu(event: MouseEvent) {
  if (props.node.kind !== "file") {
    return;
  }

  event.preventDefault();
  emit("file-context", { path: props.node.path, x: event.clientX, y: event.clientY });
}

function onToggleFavourite(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (props.node.kind !== "file") {
    return;
  }

  emit("toggle-favourite", props.node.path);
}
</script>

<template>
  <li class="file-tree-node">
    <button
      v-if="node.kind === 'dir'"
      type="button"
      class="file-tree-node__row file-tree-node__row--dir"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
      @click="toggleExpanded"
    >
      <span class="file-tree-node__chevron" :class="{ 'file-tree-node__chevron--open': expanded }">›</span>
      <span class="file-tree-node__name">{{ node.name }}</span>
    </button>

    <div
      v-else
      class="file-tree-node__row file-tree-node__row--file"
      :data-file-path="node.path"
      :class="{
        'file-tree-node__row--active': activePath === node.path,
        'file-tree-node__row--loading': loadingPath === node.path,
      }"
      :style="{ paddingLeft: `${depth * 12 + 20}px` }"
      @contextmenu="onFileContextMenu"
    >
      <button type="button" class="file-tree-node__select" @click="selectFile">
        <span class="file-tree-node__name">{{ node.name }}</span>
      </button>
      <button
        type="button"
        class="file-tree-node__favourite"
        :class="{ 'file-tree-node__favourite--active': favouritePaths[node.path] }"
        :aria-label="t('files.favourite')"
        @click="onToggleFavourite"
      >
        ★
      </button>
      <span v-if="changedPaths[node.path]" class="file-tree-node__changed" aria-label="git changed">●</span>
      <span v-if="dirtyPaths[node.path]" class="file-tree-node__dirty" :aria-label="t('files.unsaved')">•</span>
    </div>

    <ul v-if="node.kind === 'dir' && expanded && node.children.length > 0" class="file-tree-node__children">
      <FileTreeNodeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :active-path="activePath"
        :loading-path="loadingPath"
        :dirty-paths="dirtyPaths"
        :changed-paths="changedPaths"
        :favourite-paths="favouritePaths"
        @select="emit('select', $event)"
        @file-context="emit('file-context', $event)"
        @toggle-favourite="emit('toggle-favourite', $event)"
      />
    </ul>
  </li>
</template>

<style scoped lang="scss">
.file-tree-node {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-tree-node__children {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-tree-node__row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-text, #111118);
  font-size: 0.8125rem;
  line-height: 1.3;
  text-align: left;
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
  padding-right: 0.5rem;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: var(--color-surface-alt, #f4f4f8);
  }
}

.file-tree-node__row--active {
  background: color-mix(in srgb, var(--color-primary, #5b4cdb) 12%, var(--color-surface-alt, #f4f4f8));
  color: var(--color-primary, #5b4cdb);
  font-weight: 600;
}

.file-tree-node__row--loading {
  opacity: 0.65;
}

.file-tree-node__row--dir {
  font-weight: 600;
  color: var(--color-text-secondary, #5c5c6f);
}

.file-tree-node__chevron {
  display: inline-block;
  width: 0.75rem;
  transition: transform 120ms ease;
  color: var(--color-text-tertiary, #7a7a8c);
}

.file-tree-node__chevron--open {
  transform: rotate(90deg);
}

.file-tree-node__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tree-node__select {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

.file-tree-node__dirty {
  color: var(--color-primary, #5b4cdb);
  font-weight: 700;
}

.file-tree-node__changed {
  color: #b54708;
  font-size: 0.7rem;
}

.file-tree-node__favourite {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: #c5c5d5;
  cursor: pointer;
  padding: 0 0.1rem;
  line-height: 1;

  &:hover {
    color: #f59e0b;
  }
}

.file-tree-node__favourite--active {
  color: #f59e0b;
}
</style>
