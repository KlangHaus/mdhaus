<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
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
import GitDetailsModal from "./GitDetailsModal.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import EditorFontSizeControl from "./EditorFontSizeControl.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import RenameFileModal from "./RenameFileModal.vue";
import CreateFolderModal from "./CreateFolderModal.vue";
import NewFileModal from "./NewFileModal.vue";
import type { FileTemplateId } from "../lib/fileTemplates";
import ShortcutsModal from "./ShortcutsModal.vue";
import SyntaxSidebar from "./SyntaxSidebar.vue";
import SplitPane from "./SplitPane.vue";
import FileTabsBar from "./FileTabsBar.vue";
import BacklinksSidebar from "./BacklinksSidebar.vue";
import DiffModal from "./DiffModal.vue";
import CommitModal, { type CommitConfirmPayload } from "./CommitModal.vue";
import TagsSidebar from "./TagsSidebar.vue";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";
import { useWorkspace } from "../composables/useWorkspace";
import { formatDocumentStats, getDocumentStats } from "../lib/documentStats";
import { findHeadingLineNumber, findHeadingReference } from "../lib/headings";
import {
  markdownImageReference,
  readFileAsBytes,
  suggestImageDestination,
} from "../lib/imageDrop";
import { FILES_SIDEBAR_OPEN_KEY, loadSidebarOpen, saveSidebarOpen } from "../types/sidebar";
import { loadPaneLayout, savePaneLayout, type PaneLayout } from "../types/layout";
import { loadPreferences, savePreferences } from "../types/preferences";
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
  fileGitAuthor,
  gitContributors,
  workspaceTags,
  tagsLoading,
  commitWorkspace,
  refreshWorkspaceGitChangedPaths,
  pushWorkspace,
  pullWorkspace,
  gitSyncing,
  favouriteFiles,
  toggleFavourite,
  openTabs,
  closeTab,
  diskContentByPath,
  backlinks,
  backlinksLoading,
  refreshBacklinks,
} = useWorkspace();

const syntaxOpen = ref(false);
const frontMatterOpen = ref(false);
const shortcutsOpen = ref(false);
const instructionsOpen = ref(false);
const paneLayout = ref<PaneLayout>(loadPaneLayout());
const filesSidebarOpen = ref(loadSidebarOpen(FILES_SIDEBAR_OPEN_KEY));
const renameTarget = ref<{ path: string; name: string } | null>(null);
const createFolderOpen = ref(false);
const newFileOpen = ref(false);
const createFolderDefaultName = ref("untitled-folder");
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const previewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null);
const previewReadOnly = ref(false);
const focusMode = ref(false);
const backlinksOpen = ref(false);
const diffOpen = ref(false);
const gitDetailsOpen = ref(false);
const commitOpen = ref(false);
const committing = ref(false);
const tagsOpen = ref(false);
const activeTagFilter = ref<string | null>(null);
const spellcheckEnabled = ref(loadPreferences().spellcheck);
const autoBackupEnabled = ref(loadPreferences().autoBackup);

watch(spellcheckEnabled, (value) => {
  savePreferences({ spellcheck: value });
});

watch(autoBackupEnabled, (value) => {
  savePreferences({ autoBackup: value });
});

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

async function onNewFileConfirm(templateId: FileTemplateId) {
  newFileOpen.value = false;
  await createNewFile(templateId);
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
    toggleFocusMode,
    openFind: () => {
      editorRef.value?.openSearch();
    },
    showShortcuts: () => {
      shortcutsOpen.value = true;
    },
    closeOverlay: () => {
      shortcutsOpen.value = false;
      syntaxOpen.value = false;
      frontMatterOpen.value = false;
      instructionsOpen.value = false;
      diffOpen.value = false;
      gitDetailsOpen.value = false;
      commitOpen.value = false;
      if (focusMode.value) {
        focusMode.value = false;
      }
    },
  },
  { syntaxOpen, shortcutsOpen, instructionsOpen, frontMatterOpen, focusMode, diffOpen, commitOpen },
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

function toggleFocusMode() {
  focusMode.value = !focusMode.value;
  if (focusMode.value) {
    paneLayout.value = "editor";
    filesSidebarOpen.value = false;
    syntaxOpen.value = false;
    frontMatterOpen.value = false;
    backlinksOpen.value = false;
    tagsOpen.value = false;
  }
}

function toggleDiffView() {
  if (!filePath.value) {
    return;
  }

  diffOpen.value = true;
}

function openCommitModal() {
  if (!canCommitWorkspace.value) {
    return;
  }

  void refreshWorkspaceGitChangedPaths().then(() => {
    commitOpen.value = true;
  });
}

async function onCommitConfirm(payload: CommitConfirmPayload) {
  committing.value = true;
  try {
    const committed = await commitWorkspace(payload.message, payload.files);
    if (committed) {
      commitOpen.value = false;
    }
  } finally {
    committing.value = false;
  }
}

function onTagSelect(tag: string) {
  activeTagFilter.value = tag;
}

function clearTagFilter() {
  activeTagFilter.value = null;
}

const currentDiskContent = computed(() => {
  if (!filePath.value) {
    return "";
  }

  return diskContentByPath.value[filePath.value] ?? "";
});

const currentFileName = computed(() => {
  if (!filePath.value) {
    return t("toolbar.untitled");
  }

  return basename(filePath.value);
});

const canCommitWorkspace = computed(() => {
  if (!workspaceRoot.value || !workspaceGitInfo.value) {
    return false;
  }

  return Object.keys(workspaceGitChangedPaths.value).length > 0;
});

const commitFilePaths = computed(() => {
  if (!workspaceRoot.value) {
    return [];
  }

  const prefix = `${workspaceRoot.value}/`;
  return Object.keys(workspaceGitChangedPaths.value)
    .map((path) => {
      if (path.startsWith(prefix)) {
        return path.slice(prefix.length);
      }

      if (path === workspaceRoot.value) {
        return ".";
      }

      return basename(path);
    })
    .sort((left, right) => left.localeCompare(right));
});

const tagFilterPaths = computed(() => {
  if (!activeTagFilter.value) {
    return null;
  }

  const entry = workspaceTags.value.find((candidate) => candidate.tag === activeTagFilter.value);
  if (!entry) {
    return null;
  }

  return new Set(entry.paths);
});

async function onImageDrop(file: File) {
  if (!workspaceRoot.value) {
    status.value = t("status.chooseFolderFirst");
    return;
  }

  let destination = suggestImageDestination(file.name, workspaceRoot.value, filePath.value);
  let attempt = 1;
  while (attempt < 20) {
    try {
      const bytes = await readFileAsBytes(file);
      const savedPath = await invoke<string>("write_binary_file", { path: destination, bytes });
      const markdown = markdownImageReference(savedPath, filePath.value);
      editorRef.value?.insertTextAtCursor(`\n${markdown}\n`);
      status.value = t("status.insertedImage", { name: basename(savedPath) });
      return;
    } catch (error) {
      const message = String(error);
      if (!message.includes("exists") && !message.includes("Already")) {
        status.value = t("status.imageDropFailed", { error: message });
        return;
      }

      const dot = destination.lastIndexOf(".");
      const stem = dot === -1 ? destination : destination.slice(0, dot);
      const ext = dot === -1 ? "" : destination.slice(dot);
      destination = `${stem}-${attempt}${ext}`;
      attempt += 1;
    }
  }
}

const moreActions = computed(() => [
  { label: t("toolbar.saveAs"), value: "saveAs" },
  ...(canCommitWorkspace.value ? [{ label: t("git.commit"), value: "gitCommit" }] : []),
  { label: t("toolbar.print"), value: "print" },
  { label: t("toolbar.exportHtml"), value: "exportHtml" },
  { label: t("toolbar.exportPdf"), value: "exportPdf" },
  { label: t("toolbar.exportToc"), value: "exportToc" },
  { label: previewReadOnly.value ? t("toolbar.readOnlyOff") : t("toolbar.readOnly"), value: "toggleReadOnly" },
  { label: focusMode.value ? t("toolbar.focusOff") : t("toolbar.focus"), value: "toggleFocus" },
  { label: t("toolbar.showDiff"), value: "showDiff" },
  { label: backlinksOpen.value ? t("backlinks.hide") : t("backlinks.show"), value: "toggleBacklinks" },
  { label: tagsOpen.value ? t("tags.hide") : t("tags.show"), value: "toggleTags" },
  { label: spellcheckEnabled.value ? t("toolbar.spellcheckOff") : t("toolbar.spellcheck"), value: "toggleSpellcheck" },
  { label: autoBackupEnabled.value ? t("toolbar.autoBackupOff") : t("toolbar.autoBackup"), value: "toggleAutoBackup" },
  { label: t("toolbar.instructions"), value: "instructions" },
  { label: t("toolbar.shortcuts"), value: "shortcuts" },
]);

function onMoreActionSelect(item: OverflowMenuItem) {
  if (item.value === "saveAs") {
    void saveFile(true);
  } else if (item.value === "gitCommit") {
    openCommitModal();
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
  } else if (item.value === "toggleFocus") {
    toggleFocusMode();
  } else if (item.value === "showDiff") {
    toggleDiffView();
  } else if (item.value === "toggleBacklinks") {
    backlinksOpen.value = !backlinksOpen.value;
    if (backlinksOpen.value) {
      void refreshBacklinks();
    }
  } else if (item.value === "toggleTags") {
    tagsOpen.value = !tagsOpen.value;
  } else if (item.value === "toggleSpellcheck") {
    spellcheckEnabled.value = !spellcheckEnabled.value;
  } else if (item.value === "toggleAutoBackup") {
    autoBackupEnabled.value = !autoBackupEnabled.value;
  } else if (item.value === "instructions") {
    instructionsOpen.value = true;
  } else if (item.value === "shortcuts") {
    shortcutsOpen.value = true;
  }
}
</script>

<template>
  <div class="app-shell flex flex-col h-full" :class="{ 'app-shell--focus': focusMode }">
    <header v-if="!focusMode" class="toolbar flex items-center gap-2 px-4 py-2 border-b bg-surface-raised">
      <GTButton size="sm" variant="secondary" @click="openFolder">{{ t("toolbar.openFolder") }}</GTButton>
      <GTButton size="sm" variant="secondary" @click="openFile">{{ t("toolbar.openFile") }}</GTButton>
      <GTButton size="sm" variant="primary" @click="saveFile(false)">{{ t("toolbar.save") }}</GTButton>
      <GTButton
        v-if="canCommitWorkspace"
        size="sm"
        variant="outlined"
        @click="openCommitModal"
      >
        {{ t("git.commit") }}
      </GTButton>

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

      <GitStatusBadge :info="workspaceGitInfo" @show-details="gitDetailsOpen = true" />
    </header>

    <main class="app-shell__main flex-1">
      <div
        class="workspace layout-with-sidebar h-full"
        :class="{ 'layout-with-sidebar--files-collapsed': !filesSidebarOpen }"
      >
        <div class="workspace__editor relative min-h-0 overflow-hidden">
          <FileTabsBar
            v-if="!focusMode"
            :tabs="openTabs"
            :active-path="filePath"
            :dirty-paths="dirtyPathMap"
            @select="openFileFromTree"
            @close="closeTab"
          />
          <SplitPane :layout="paneLayout">
            <template #left>
              <MarkdownEditor
                ref="editorRef"
                :model-value="content"
                :readonly="previewReadOnly"
                :spellcheck="spellcheckEnabled"
                @update:model-value="setContent"
                @scroll="onEditorScroll"
                @image-drop="onImageDrop"
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
          <div v-if="syntaxOpen && !focusMode" class="workspace__syntax-overlay">
            <SyntaxSidebar v-model:open="syntaxOpen" />
          </div>
          <div v-if="backlinksOpen && !focusMode" class="workspace__backlinks-overlay">
            <BacklinksSidebar
              v-model:open="backlinksOpen"
              :backlinks="backlinks"
              :loading="backlinksLoading"
              @select="openFileFromTree"
            />
          </div>
          <div v-if="tagsOpen && !focusMode" class="workspace__tags-overlay">
            <TagsSidebar
              v-model:open="tagsOpen"
              :tags="workspaceTags"
              :active-tag="activeTagFilter"
              :loading="tagsLoading"
              @select="onTagSelect"
              @clear="clearTagFilter"
            />
          </div>
        </div>

        <FileTreeSidebar
          v-if="!focusMode"
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
          :tag-filter-paths="tagFilterPaths"
          @open-folder="openFolder"
          @open-recent-folder="openRecentFolder"
          @open-recent-file="openRecentFile"
          @create-file="newFileOpen = true"
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

    <NewFileModal
      :open="newFileOpen"
      @close="newFileOpen = false"
      @confirm="onNewFileConfirm"
    />

    <footer v-if="!focusMode" class="statusbar border-t bg-surface-raised px-4 py-1.5 text-sm">
      <span class="statusbar__path text-secondary truncate">{{ filePath ?? t("toolbar.untitled") }}</span>
      <span v-if="dirty" class="statusbar__dirty text-primary">{{ t("toolbar.unsaved") }}</span>
      <span class="statusbar__stats text-secondary">{{ documentStatsLabel }}</span>
      <span v-if="fileGitAuthor" class="statusbar__author text-secondary" :title="fileGitAuthor.email">
        {{ t("git.lastAuthor", { name: fileGitAuthor.name, when: fileGitAuthor.committedRelative }) }}
      </span>
      <span class="statusbar__status text-secondary ml-auto">{{ status }}</span>
    </footer>
    <DiffModal
      :open="diffOpen"
      :file-path="filePath"
      :file-name="currentFileName"
      :editor-content="content"
      :disk-content="currentDiskContent"
      @close="diffOpen = false"
    />

    <GitDetailsModal
      :open="gitDetailsOpen"
      :info="workspaceGitInfo"
      :file-author="fileGitAuthor"
      :contributors="gitContributors"
      :syncing="gitSyncing"
      @close="gitDetailsOpen = false"
      @push="void pushWorkspace()"
      @pull="void pullWorkspace()"
    />

    <CommitModal
      :open="commitOpen"
      :workspace-label="workspaceLabel"
      :files="commitFilePaths"
      :committing="committing"
      @close="commitOpen = false"
      @confirm="onCommitConfirm"
    />

    <button
      v-if="focusMode"
      type="button"
      class="focus-mode-exit"
      @click="focusMode = false"
    >
      {{ t("toolbar.focusOff") }}
    </button>
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

.statusbar__author {
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell--focus .app-shell__main {
  flex: 1 1 auto;
}

.app-shell__main {
  min-height: 0;
  overflow: hidden;
  flex: 1 1 auto;
}

.workspace__backlinks-overlay {
  position: absolute;
  inset: 0;
  z-index: 16;
  pointer-events: none;

  :deep(.backlinks-aside) {
    pointer-events: auto;
  }
}

.workspace__tags-overlay {
  position: absolute;
  inset: 0;
  z-index: 16;
  pointer-events: none;

  :deep(.tags-aside) {
    pointer-events: auto;
  }
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

.focus-mode-exit {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 60;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 999px;
  background: var(--color-surface-raised, #fff);
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}
</style>
