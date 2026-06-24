<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { GTButton } from "@grundtone/vue";
import ExternalChangeModal from "./ExternalChangeModal.vue";
import FileTreeSidebar from "./FileTreeSidebar.vue";
import InstructionsModal from "./InstructionsModal.vue";
import LayoutSwitcher from "./LayoutSwitcher.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import ShortcutsModal from "./ShortcutsModal.vue";
import SyntaxSidebar from "./SyntaxSidebar.vue";
import SplitPane from "./SplitPane.vue";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";
import { useWorkspace } from "../composables/useWorkspace";
import { formatDocumentStats, getDocumentStats } from "../lib/documentStats";
import { findHeadingLineNumber } from "../lib/headings";
import { loadPaneLayout, savePaneLayout, type PaneLayout } from "../types/layout";
import { useI18n } from "../i18n/useI18n";

const { t } = useI18n();

const {
  content,
  cacheRevision,
  createNewFile,
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
  printCurrentDocument,
  reloadExternalChanges,
  saveFile,
  setContent,
  status,
  title,
  workspaceLabel,
  workspaceRoot,
} = useWorkspace();

const syntaxOpen = ref(false);
const shortcutsOpen = ref(false);
const instructionsOpen = ref(false);
const paneLayout = ref<PaneLayout>(loadPaneLayout());
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const previewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null);

watch(paneLayout, (value) => {
  savePaneLayout(value);
});

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
      instructionsOpen.value = false;
    },
  },
  { syntaxOpen, shortcutsOpen, instructionsOpen },
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
      <LayoutSwitcher v-model:layout="paneLayout" />
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
      <div class="workspace layout-with-sidebar h-full">
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
          <div v-if="syntaxOpen" class="workspace__syntax-overlay">
            <SyntaxSidebar v-model:open="syntaxOpen" />
          </div>
        </div>

        <FileTreeSidebar
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
  grid-template-columns: minmax(0, 1fr) 17.5rem;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.workspace__editor {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
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
