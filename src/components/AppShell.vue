<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { GTButton } from "@grundtone/vue";
import ExternalChangeModal from "./ExternalChangeModal.vue";
import FileTreeSidebar from "./FileTreeSidebar.vue";
import FrontMatterSidebar from "./FrontMatterSidebar.vue";
import InstructionsModal from "./InstructionsModal.vue";
import LayoutSwitcher from "./LayoutSwitcher.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import RenameFileModal from "./RenameFileModal.vue";
import ShortcutsModal from "./ShortcutsModal.vue";
import SyntaxSidebar from "./SyntaxSidebar.vue";
import SplitPane from "./SplitPane.vue";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";
import { useWorkspace } from "../composables/useWorkspace";
import { formatDocumentStats, getDocumentStats } from "../lib/documentStats";
import { findHeadingLineNumber } from "../lib/headings";
import { FILES_SIDEBAR_OPEN_KEY, loadSidebarOpen, saveSidebarOpen } from "../types/sidebar";
import { loadPaneLayout, savePaneLayout, type PaneLayout } from "../types/layout";
import { useI18n } from "../i18n/useI18n";

const { t } = useI18n();

const {
  content,
  cacheRevision,
  createNewFile,
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
  openNextFile,
  openPreviousFile,
  exportCurrentDocumentToHtml,
  printCurrentDocument,
  reloadExternalChanges,
  renameFile,
  saveFile,
  setContent,
  status,
  title,
  workspaceLabel,
  workspaceRoot,
} = useWorkspace();

const syntaxOpen = ref(false);
const frontMatterOpen = ref(false);
const shortcutsOpen = ref(false);
const instructionsOpen = ref(false);
const paneLayout = ref<PaneLayout>(loadPaneLayout());
const filesSidebarOpen = ref(loadSidebarOpen(FILES_SIDEBAR_OPEN_KEY));
const renameTarget = ref<{ path: string; name: string } | null>(null);
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const previewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null);

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

function onRenameRequest(path: string) {
  renameTarget.value = { path, name: basename(path) };
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
</script>

<template>
  <div class="app-shell flex flex-col h-full">
    <header class="toolbar flex items-center gap-2 px-4 py-2 border-b bg-surface-raised">
      <GTButton size="sm" variant="secondary" @click="openFolder">{{ t("toolbar.openFolder") }}</GTButton>
      <GTButton size="sm" variant="secondary" @click="openFile">{{ t("toolbar.openFile") }}</GTButton>
      <GTButton size="sm" variant="primary" @click="saveFile(false)">{{ t("toolbar.save") }}</GTButton>
      <GTButton size="sm" variant="outlined" @click="saveFile(true)">{{ t("toolbar.saveAs") }}</GTButton>
      <GTButton size="sm" variant="outlined" @click="printCurrentDocument">{{ t("toolbar.print") }}</GTButton>
      <GTButton size="sm" variant="outlined" @click="exportCurrentDocumentToHtml">{{ t("toolbar.exportHtml") }}</GTButton>
      <LayoutSwitcher v-model:layout="paneLayout" />
      <GTButton size="sm" variant="outlined" @click="frontMatterOpen = !frontMatterOpen">
        {{ frontMatterOpen ? t("toolbar.metadataHide") : t("toolbar.metadata") }}
      </GTButton>
      <GTButton size="sm" variant="outlined" @click="syntaxOpen = !syntaxOpen">
        {{ syntaxOpen ? t("toolbar.syntaxHide") : t("toolbar.syntax") }}
      </GTButton>
      <GTButton size="sm" variant="outlined" @click="instructionsOpen = true">{{ t("toolbar.instructions") }}</GTButton>
      <GTButton size="sm" variant="outlined" @click="shortcutsOpen = true">{{ t("toolbar.shortcuts") }}</GTButton>
      <LanguageSwitcher />
      <ThemeSwitcher />
      <span class="toolbar__path text-secondary text-sm truncate">
        {{ filePath ?? t("toolbar.untitled") }}
      </span>
      <span v-if="dirty" class="toolbar__dirty text-primary text-sm">{{ t("toolbar.unsaved") }}</span>
      <span class="toolbar__stats text-secondary text-sm">{{ documentStatsLabel }}</span>
      <span class="toolbar__status text-secondary text-sm ml-auto">{{ status }}</span>
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
                @update:model-value="setContent"
                @scroll="onEditorScroll"
              />
            </template>
            <template #right>
              <MarkdownPreview
                ref="previewRef"
                :source="content"
                @scroll="onPreviewScroll"
                @heading-click="onPreviewHeadingClick"
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
          :has-workspace="hasWorkspace"
          :cache-revision="cacheRevision"
          :get-cached-contents="getCachedContents"
          @open-folder="openFolder"
          @create-file="createNewFile"
          @select="openFileFromTree"
          @rename="onRenameRequest"
          @delete="deleteFile"
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
}

.toolbar__path {
  max-width: 18%;
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
