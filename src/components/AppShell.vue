<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { GTButton, GTOverflowMenu, type OverflowMenuItem } from "@grundtone/vue";
import ExternalChangeModal from "./ExternalChangeModal.vue";
import FileTreeSidebar from "./FileTreeSidebar.vue";
import FrontMatterSidebar from "./FrontMatterSidebar.vue";
import InstructionsModal from "./InstructionsModal.vue";
import LayoutSwitcher from "./LayoutSwitcher.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import GitStatusBadge from "./GitStatusBadge.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import EditorFontSizeControl from "./EditorFontSizeControl.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import RenameFileModal from "./RenameFileModal.vue";
import CreateFolderModal from "./CreateFolderModal.vue";
import ShortcutsModal from "./ShortcutsModal.vue";
import SyntaxSidebar from "./SyntaxSidebar.vue";
import SplitPane from "./SplitPane.vue";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";
import { useWorkspace } from "../composables/useWorkspace";
import { formatDocumentStats, getDocumentStats } from "../lib/documentStats";
import { findHeadingLineNumber, findHeadingReference } from "../lib/headings";
import { FILES_SIDEBAR_OPEN_KEY, loadSidebarOpen, saveSidebarOpen } from "../types/sidebar";
import { loadPaneLayout, savePaneLayout, type PaneLayout } from "../types/layout";
import { useI18n } from "../i18n/useI18n";

const { t } = useI18n();

const {
  content,
  cacheRevision,
  createNewFile,
  createNewFolder,
  suggestNewFolderName,
  deleteFile,
  dirty,
  dirtyPathMap,
  externalChange,
  filePath,
  fileTree,
  getCachedContents,
  keepExternalChanges,
  loadingPath,
  openFile,
  openFileFromTree,
  openFolder,
  openRecentFolder,
  openRecentFile,
  openNextFile,
  openPreviousFile,
  exportCurrentDocumentToHtml,
  exportCurrentDocumentToPdf,
  exportDocumentToc,
  printCurrentDocument,
  recentFiles,
  recentFolders,
  reloadExternalChanges,
  renameFile,
  saveFile,
  setContent,
  status,
  title,
  workspaceLabel,
  workspaceRoot,
  workspaceFiles,
  workspaceGitChangedPaths,
  workspaceGitInfo,
  favouriteFiles,
  toggleFavourite,
} = useWorkspace();

const syntaxOpen = ref(false);
const frontMatterOpen = ref(false);
const shortcutsOpen = ref(false);
const instructionsOpen = ref(false);
const paneLayout = ref<PaneLayout>(loadPaneLayout());
const filesSidebarOpen = ref(loadSidebarOpen(FILES_SIDEBAR_OPEN_KEY));
const renameTarget = ref<{ path: string; name: string } | null>(null);
const createFolderOpen = ref(false);
const createFolderDefaultName = ref("untitled-folder");
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const previewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null);
const previewReadOnly = ref(false);

watch(paneLayout, (value) => {
  savePaneLayout(value);
});

watch(filesSidebarOpen, (value) => {
  saveSidebarOpen(FILES_SIDEBAR_OPEN_KEY, value);
});

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

function workspaceRelativePath(path: string): string {
  if (!workspaceRoot.value) {
    return basename(path);
  }

  const prefix = `${workspaceRoot.value}/`;
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }

  return basename(path);
}

function onRenameRequest(path: string) {
  renameTarget.value = { path, name: workspaceRelativePath(path) };
}

async function onRenameConfirm(newName: string) {
  if (!renameTarget.value) {
    return;
  }

  const from = renameTarget.value.path;
  renameTarget.value = null;
  await renameFile(from, newName);
}

function onRenameClose() {
  renameTarget.value = null;
}

function onCreateFolderRequest() {
  createFolderDefaultName.value = suggestNewFolderName();
  createFolderOpen.value = true;
}

function onCreateFolderClose() {
  createFolderOpen.value = false;
}

async function onCreateFolderConfirm(name: string) {
  createFolderOpen.value = false;
  await createNewFolder(name);
}

function onEditorScroll(ratio: number) {
  if (paneLayout.value !== "split") {
    return;
  }

  previewRef.value?.setScrollRatio(ratio);
}

function onPreviewScroll(ratio: number) {
  if (paneLayout.value !== "split") {
    return;
  }

  editorRef.value?.setScrollRatio(ratio);
}

function onPreviewHeadingClick(id: string) {
  if (paneLayout.value === "preview") {
    paneLayout.value = "split";
  }

  nextTick(() => {
    const line = findHeadingLineNumber(content.value, id);
    if (line !== null) {
      editorRef.value?.scrollToLine(line);
    }
  });
}

async function onPreviewWikilinkClick(payload: { path: string; heading: string | null }) {
  if (paneLayout.value === "preview") {
    paneLayout.value = "split";
  }

  await nextTick();
  const opened = await openFileFromTree(payload.path);
  if (!opened) {
    status.value = t("status.wikilinkNotFound");
    return;
  }

  if (!payload.heading) {
    return;
  }

  await nextTick();
  const reference = findHeadingReference(content.value, payload.heading);
  if (reference === null) {
    return;
  }

  editorRef.value?.scrollToLine(reference.line);
  previewRef.value?.scrollToHeading(reference.id);
}

const documentStatsLabel = computed(() =>
  formatDocumentStats(getDocumentStats(content.value), t),
);
const hasWorkspace = computed(() => workspaceRoot.value !== null);

let menuUnlisteners: UnlistenFn[] = [];

onMounted(async () => {
  menuUnlisteners = await Promise.all([
    listen("menu-toggle-syntax", () => {
      syntaxOpen.value = !syntaxOpen.value;
    }),
    listen("menu-instructions", () => {
      instructionsOpen.value = true;
    }),
  ]);
});

onUnmounted(() => {
  menuUnlisteners.forEach((unlisten) => unlisten());
});

useKeyboardShortcuts(
  {
    openFile,
    openFolder,
    saveFile: () => saveFile(false),
    saveAs: () => saveFile(true),
    printDocument: printCurrentDocument,
    openNextFile,
    openPreviousFile,
    toggleSyntax: () => {
      syntaxOpen.value = !syntaxOpen.value;
    },
    showShortcuts: () => {
      shortcutsOpen.value = true;
    },
    closeOverlay: () => {
      shortcutsOpen.value = false;
      syntaxOpen.value = false;
      frontMatterOpen.value = false;
      instructionsOpen.value = false;
    },
  },
  { syntaxOpen, shortcutsOpen, instructionsOpen, frontMatterOpen },
);

watch(title, (value) => {
  getCurrentWindow().setTitle(value).catch(() => undefined);
});

function openShortcutsFromInstructions() {
  instructionsOpen.value = false;
  shortcutsOpen.value = true;
}

function togglePreviewReadOnly() {
  previewReadOnly.value = !previewReadOnly.value;
  if (previewReadOnly.value && paneLayout.value !== "preview") {
    paneLayout.value = "preview";
  }
}

const moreActions = computed(() => [
  { label: t("toolbar.saveAs"), value: "saveAs" },
  { label: t("toolbar.print"), value: "print" },
  { label: t("toolbar.exportHtml"), value: "exportHtml" },
  { label: "Eksporter PDF", value: "exportPdf" },
  { label: "Eksporter TOC", value: "exportToc" },
  { label: previewReadOnly.value ? "Slå læsetilstand fra" : "Læsetilstand", value: "toggleReadOnly" },
  { label: t("toolbar.instructions"), value: "instructions" },
  { label: t("toolbar.shortcuts"), value: "shortcuts" },
]);

function onMoreActionSelect(item: OverflowMenuItem) {
  if (item.value === "saveAs") {
    void saveFile(true);
  } else if (item.value === "print") {
    void printCurrentDocument();
  } else if (item.value === "exportHtml") {
    void exportCurrentDocumentToHtml();
  } else if (item.value === "exportPdf") {
    void exportCurrentDocumentToPdf();
  } else if (item.value === "exportToc") {
    void exportDocumentToc();
  } else if (item.value === "toggleReadOnly") {
    togglePreviewReadOnly();
  } else if (item.value === "instructions") {
    instructionsOpen.value = true;
  } else if (item.value === "shortcuts") {
    shortcutsOpen.value = true;
  }
}
</script>

<template>
  <div class="app-shell flex flex-col h-full">
    <header class="toolbar flex items-center gap-2 px-4 py-2 border-b bg-surface-raised">
      <GTButton size="sm" variant="secondary" @click="openFolder">{{ t("toolbar.openFolder") }}</GTButton>
      <GTButton size="sm" variant="secondary" @click="openFile">{{ t("toolbar.openFile") }}</GTButton>
      <GTButton size="sm" variant="primary" @click="saveFile(false)">{{ t("toolbar.save") }}</GTButton>

      <div class="toolbar__divider" aria-hidden="true" />
      <LayoutSwitcher v-model:layout="paneLayout" />
      <GTButton size="sm" variant="outlined" @click="frontMatterOpen = !frontMatterOpen">
        {{ frontMatterOpen ? t("toolbar.metadataHide") : t("toolbar.metadata") }}
      </GTButton>
      <GTButton size="sm" variant="outlined" @click="syntaxOpen = !syntaxOpen">
        {{ syntaxOpen ? t("toolbar.syntaxHide") : t("toolbar.syntax") }}
      </GTButton>

      <div class="toolbar__divider" aria-hidden="true" />
      <LanguageSwitcher />
      <EditorFontSizeControl />
      <ThemeSwitcher />

      <GTOverflowMenu
        class="toolbar__more"
        label="⋯"
        align="right"
        :items="moreActions"
        aria-label="Flere handlinger"
        @select="onMoreActionSelect"
      />

      <GitStatusBadge :info="workspaceGitInfo" />
    </header>

    <main class="app-shell__main flex-1">
      <div
        class="workspace layout-with-sidebar h-full"
        :class="{ 'layout-with-sidebar--files-collapsed': !filesSidebarOpen }"
      >
        <div class="workspace__editor relative min-h-0 overflow-hidden">
          <SplitPane :layout="paneLayout">
            <template #left>
              <MarkdownEditor
                ref="editorRef"
                :model-value="content"
                :readonly="previewReadOnly"
                @update:model-value="setContent"
                @scroll="onEditorScroll"
              />
            </template>
            <template #right>
              <MarkdownPreview
                ref="previewRef"
                :source="content"
                :workspace-files="workspaceFiles"
                :current-file-path="filePath"
                @scroll="onPreviewScroll"
                @heading-click="onPreviewHeadingClick"
                @wikilink-click="onPreviewWikilinkClick"
              />
            </template>
          </SplitPane>
          <div v-if="frontMatterOpen" class="workspace__front-matter-overlay">
            <FrontMatterSidebar v-model:open="frontMatterOpen" :source="content" @apply="setContent" />
          </div>
          <div v-if="syntaxOpen" class="workspace__syntax-overlay">
            <SyntaxSidebar v-model:open="syntaxOpen" />
          </div>
        </div>

        <FileTreeSidebar
          v-model:open="filesSidebarOpen"
          :workspace-label="workspaceLabel"
          :workspace-root="workspaceRoot"
          :file-tree="fileTree"
          :active-path="filePath"
          :loading-path="loadingPath"
          :dirty-paths="dirtyPathMap"
          :changed-paths="workspaceGitChangedPaths"
          :favourite-paths="Object.fromEntries(favouriteFiles.map((path) => [path, true]))"
          :has-workspace="hasWorkspace"
          :recent-folders="recentFolders"
          :recent-files="recentFiles"
          :cache-revision="cacheRevision"
          :get-cached-contents="getCachedContents"
          @open-folder="openFolder"
          @open-recent-folder="openRecentFolder"
          @open-recent-file="openRecentFile"
          @create-file="createNewFile"
          @create-folder="onCreateFolderRequest"
          @select="openFileFromTree"
          @rename="onRenameRequest"
          @delete="deleteFile"
          @toggle-favourite="toggleFavourite"
        />
      </div>
    </main>

    <ShortcutsModal :open="shortcutsOpen" @close="shortcutsOpen = false" />
    <InstructionsModal
      :open="instructionsOpen"
      @close="instructionsOpen = false"
      @show-shortcuts="openShortcutsFromInstructions"
    />
    <ExternalChangeModal
      :change="externalChange"
      @reload="reloadExternalChanges"
      @keep="keepExternalChanges"
    />
    <RenameFileModal :target="renameTarget" @close="onRenameClose" @confirm="onRenameConfirm" />
    <CreateFolderModal
      :open="createFolderOpen"
      :default-name="createFolderDefaultName"
      @close="onCreateFolderClose"
      @confirm="onCreateFolderConfirm"
    />

    <footer class="statusbar border-t bg-surface-raised px-4 py-1.5 text-sm">
      <span class="statusbar__path text-secondary truncate">{{ filePath ?? t("toolbar.untitled") }}</span>
      <span v-if="dirty" class="statusbar__dirty text-primary">{{ t("toolbar.unsaved") }}</span>
      <span class="statusbar__stats text-secondary">{{ documentStatsLabel }}</span>
      <span class="statusbar__status text-secondary ml-auto">{{ status }}</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  height: 100vh;
  background: var(--color-background, #f8f8fb);
  color: var(--color-text, #111118);
}

.toolbar {
  min-height: 48px;
  border-color: var(--color-border-light, #e4e4ec);
  flex-wrap: wrap;
  align-content: center;
}

.toolbar__divider {
  width: 1px;
  height: 1.5rem;
  background: var(--color-border-light, #e4e4ec);
  flex: 0 0 auto;
}

.toolbar__more {
  flex: 0 0 auto;
}

.statusbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-color: var(--color-border-light, #e4e4ec);
}

.statusbar__path {
  max-width: 40%;
}

.app-shell__main {
  min-height: 0;
  overflow: hidden;
  flex: 1 1 auto;
}

.layout-with-sidebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--mdhaus-files-sidebar-width, 17.5rem);
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.layout-with-sidebar--files-collapsed {
  --mdhaus-files-sidebar-width: 2.5rem;
}

.workspace__editor {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.workspace__front-matter-overlay {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;

  :deep(.front-matter-aside) {
    pointer-events: auto;
  }
}

.workspace__syntax-overlay {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;

  :deep(.syntax-aside) {
    pointer-events: auto;
  }
}
</style>
