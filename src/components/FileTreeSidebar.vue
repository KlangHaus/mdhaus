<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { GTButton } from "@grundtone/vue";
import type { FileTreeNode } from "../types/files";
import type { RecentFileEntry } from "../types/recent";
import { basename, recentFileSubtitle } from "../types/recent";
import { filterFileTree, findCachedContentMatches } from "../lib/fileTree";
import { useI18n } from "../i18n/useI18n";
import FileTreeNodeItem from "./FileTreeNode.vue";
import FileContextMenu from "./FileContextMenu.vue";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: true });

const emit = defineEmits<{
  "open-folder": [];
  "open-recent-folder": [path: string];
  "open-recent-file": [entry: RecentFileEntry];
  "create-file": [];
  "create-folder": [];
  select: [path: string];
  rename: [path: string];
  delete: [path: string];
}>();

const props = defineProps<{
  workspaceLabel: string;
  workspaceRoot: string | null;
  fileTree: FileTreeNode[];
  activePath: string | null;
  loadingPath: string | null;
  dirtyPaths: Record<string, boolean>;
  hasWorkspace: boolean;
  recentFolders: string[];
  recentFiles: RecentFileEntry[];
  cacheRevision: number;
  getCachedContents: () => Record<string, string>;
}>();

const searchQuery = ref("");
const contentMatchPaths = ref<Set<string>>(new Set());
const contentSearching = ref(false);
const contextMenu = ref<{ path: string; x: number; y: number } | null>(null);

function closeContextMenu() {
  contextMenu.value = null;
}

function onFileContext(payload: { path: string; x: number; y: number }) {
  contextMenu.value = payload;
}

function onContextRename() {
  if (!contextMenu.value) {
    return;
  }

  emit("rename", contextMenu.value.path);
  closeContextMenu();
}

function onContextDelete() {
  if (!contextMenu.value) {
    return;
  }

  emit("delete", contextMenu.value.path);
  closeContextMenu();
}

let searchGeneration = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const visibleTree = computed(() =>
  filterFileTree(props.fileTree, searchQuery.value, contentMatchPaths.value),
);

const showRecentSections = computed(() => searchQuery.value.trim().length < 2);

async function runContentSearch(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) {
    contentMatchPaths.value = new Set();
    contentSearching.value = false;
    return;
  }

  const generation = ++searchGeneration;
  contentSearching.value = true;

  const cachedContents = props.getCachedContents();
  const merged = findCachedContentMatches(cachedContents, needle);

  if (props.workspaceRoot) {
    try {
      const diskMatches = await invoke<string[]>("search_markdown_content", {
        root: props.workspaceRoot,
        query: needle,
      });

      if (generation !== searchGeneration) {
        return;
      }

      for (const path of diskMatches) {
        if (!Object.prototype.hasOwnProperty.call(cachedContents, path)) {
          merged.add(path);
        }
      }
    } catch {
      if (generation !== searchGeneration) {
        return;
      }
    }
  }

  if (generation !== searchGeneration) {
    return;
  }

  contentMatchPaths.value = merged;
  contentSearching.value = false;
}

watch(
  () => [searchQuery.value, props.cacheRevision, props.workspaceRoot] as const,
  ([query]) => {
    clearTimeout(searchTimer);

    const needle = query.trim();
    if (needle.length < 2) {
      searchGeneration += 1;
      contentMatchPaths.value = new Set();
      contentSearching.value = false;
      return;
    }

    contentSearching.value = true;
    searchTimer = setTimeout(() => {
      void runContentSearch(query);
    }, 300);
  },
);

onUnmounted(() => {
  clearTimeout(searchTimer);
  searchGeneration += 1;
});

watch(
  () => props.activePath,
  (path) => {
    if (!path) {
      return;
    }

    nextTick(() => {
      const selector = `[data-file-path="${CSS.escape(path)}"]`;
      document.querySelector(selector)?.scrollIntoView({ block: "nearest" });
    });
  },
);
</script>

<template>
  <aside class="file-sidebar cq-sidebar border-l bg-surface-raised flex flex-col min-h-0" :class="{ 'file-sidebar--collapsed': !open }">
    <button
      v-if="!open"
      type="button"
      class="file-sidebar__expand"
      :aria-label="t('files.expandSidebar')"
      :title="t('files.expandSidebar')"
      @click="open = true"
    >
      ‹
    </button>

    <template v-else>
      <header class="file-sidebar__header flex flex-col gap-2 p-3 border-b">
        <div class="flex items-center justify-between gap-2">
          <h2 class="file-sidebar__title text-sm font-bold m-0">{{ t("files.title") }}</h2>
          <div class="file-sidebar__actions flex gap-1">
            <GTButton size="sm" variant="primary" :disabled="!hasWorkspace" @click="emit('create-file')">
              {{ t("files.new") }}
            </GTButton>
            <GTButton size="sm" variant="outlined" :disabled="!hasWorkspace" @click="emit('create-folder')">
              {{ t("files.newFolder") }}
            </GTButton>
            <GTButton size="sm" variant="outlined" @click="emit('open-folder')">{{ t("files.folder") }}</GTButton>
            <button
              type="button"
              class="file-sidebar__collapse"
              :aria-label="t('files.collapseSidebar')"
              :title="t('files.collapseSidebar')"
              @click="open = false"
            >
              ›
            </button>
          </div>
        </div>
      <p class="file-sidebar__root text-secondary text-xs m-0 truncate" :title="workspaceLabel">
        {{ workspaceLabel }}
      </p>
      <div class="file-sidebar__search-wrap">
        <input
          v-model="searchQuery"
          type="search"
          class="file-sidebar__search"
          :placeholder="t('files.search')"
          :disabled="fileTree.length === 0"
        />
        <p v-if="contentSearching" class="file-sidebar__search-status text-secondary text-xs m-0">
          {{ t("files.searching") }}
        </p>
      </div>
    </header>

    <div class="file-sidebar__body flex-1 min-h-0 overflow-auto p-2">
      <section
        v-if="showRecentSections && !hasWorkspace && recentFolders.length > 0"
        class="file-sidebar__recent"
        :aria-label="t('files.recentFolders')"
      >
        <h3 class="file-sidebar__recent-title">{{ t("files.recentFolders") }}</h3>
        <ul class="file-sidebar__recent-list">
          <li v-for="folderPath in recentFolders" :key="folderPath">
            <button
              type="button"
              class="file-sidebar__recent-item"
              :title="folderPath"
              @click="emit('open-recent-folder', folderPath)"
            >
              <span class="file-sidebar__recent-name">{{ basename(folderPath) }}</span>
              <span class="file-sidebar__recent-meta">{{ folderPath }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="showRecentSections && recentFiles.length > 0"
        class="file-sidebar__recent"
        :aria-label="t('files.recentFiles')"
      >
        <h3 class="file-sidebar__recent-title">{{ t("files.recentFiles") }}</h3>
        <ul class="file-sidebar__recent-list">
          <li v-for="entry in recentFiles" :key="entry.path">
            <button
              type="button"
              class="file-sidebar__recent-item"
              :class="{ 'file-sidebar__recent-item--active': entry.path === activePath }"
              :title="entry.path"
              @click="emit('open-recent-file', entry)"
            >
              <span class="file-sidebar__recent-name">{{ basename(entry.path) }}</span>
              <span class="file-sidebar__recent-meta">{{ recentFileSubtitle(entry) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <p v-if="fileTree.length === 0" class="file-sidebar__empty text-secondary text-sm m-0 p-2">
        {{ t("files.empty") }}
      </p>

      <p v-else-if="visibleTree.length === 0" class="file-sidebar__empty text-secondary text-sm m-0 p-2">
        {{ t("files.noMatch") }}
      </p>

      <ul v-else class="file-sidebar__tree">
        <FileTreeNodeItem
          v-for="node in visibleTree"
          :key="node.path"
          :node="node"
          :depth="0"
          :active-path="activePath"
          :loading-path="loadingPath"
          :dirty-paths="dirtyPaths"
          @select="emit('select', $event)"
          @file-context="onFileContext"
        />
      </ul>
    </div>
    </template>

    <FileContextMenu
      :open="contextMenu !== null"
      :x="contextMenu?.x ?? 0"
      :y="contextMenu?.y ?? 0"
      @close="closeContextMenu"
      @rename="onContextRename"
      @delete="onContextDelete"
    />
  </aside>
</template>

<style scoped lang="scss">
.file-sidebar {
  width: 17.5rem;
  flex-shrink: 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  border-color: var(--color-border-light, #e4e4ec);
}

.file-sidebar--collapsed {
  width: 2.5rem;
}

.file-sidebar__expand,
.file-sidebar__collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-secondary, #5c5c6f);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: var(--color-primary, #5b4cdb);
    border-color: color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, var(--color-border-light, #e4e4ec));
  }
}

.file-sidebar__expand {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
  font-size: 1.1rem;
}

.file-sidebar__header {
  flex-shrink: 0;
  border-color: var(--color-border-light, #e4e4ec);
}

.file-sidebar__title {
  color: var(--color-text, #111118);
}

.file-sidebar__search-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-sidebar__search {
  width: 100%;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #111118);
  font-size: 0.8rem;

  &:focus {
    outline: 2px solid color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, transparent);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.6;
  }
}

.file-sidebar__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.file-sidebar__tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-sidebar__recent {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light, #e4e4ec);
}

.file-sidebar__recent-title {
  margin: 0 0 0.35rem;
  padding: 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #5c5c6f);
}

.file-sidebar__recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-sidebar__recent-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  padding: 0.35rem 0.45rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--color-text, #111118);

  &:hover {
    background: color-mix(in srgb, var(--color-primary, #5b4cdb) 8%, transparent);
  }
}

.file-sidebar__recent-item--active {
  background: color-mix(in srgb, var(--color-primary, #5b4cdb) 12%, transparent);
}

.file-sidebar__recent-name {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
}

.file-sidebar__recent-meta {
  max-width: 100%;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--color-text-secondary, #5c5c6f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
