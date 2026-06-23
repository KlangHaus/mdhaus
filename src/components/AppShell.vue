<script setup lang="ts">
import { ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { GTButton } from "@grundtone/vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import SyntaxSidebar from "./SyntaxSidebar.vue";
import SplitPane from "./SplitPane.vue";
import { useDocument } from "../composables/useDocument";

const { content, dirty, filePath, setContent, openFile, saveFile, status, title } = useDocument();
const syntaxOpen = ref(false);

watch(title, (value) => {
  getCurrentWindow().setTitle(value).catch(() => undefined);
});
</script>

<template>
  <div class="app-shell flex flex-col h-full">
    <header class="toolbar flex items-center gap-2 px-4 py-2 border-b bg-surface-raised">
      <GTButton size="sm" variant="secondary" @click="openFile">Open</GTButton>
      <GTButton size="sm" variant="primary" @click="saveFile(false)">Save</GTButton>
      <GTButton size="sm" variant="outlined" @click="saveFile(true)">Save As</GTButton>
      <GTButton size="sm" variant="outlined" @click="syntaxOpen = !syntaxOpen">
        {{ syntaxOpen ? "Skjul syntaks" : "Syntaks" }}
      </GTButton>
      <span class="toolbar__path text-secondary text-sm truncate">
        {{ filePath ?? "Untitled.md" }}
      </span>
      <span v-if="dirty" class="toolbar__dirty text-primary text-sm">Unsaved</span>
      <span class="toolbar__status text-secondary text-sm ml-auto">{{ status }}</span>
    </header>

    <main class="app-shell__main flex-1">
      <div class="workspace grid-sidebar-right h-full">
        <div class="workspace__content min-h-0 overflow-hidden">
          <SplitPane>
            <template #left>
              <MarkdownEditor :model-value="content" @update:model-value="setContent" />
            </template>
            <template #right>
              <MarkdownPreview :source="content" />
            </template>
          </SplitPane>
        </div>
        <SyntaxSidebar v-model:open="syntaxOpen" />
      </div>
    </main>
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
}

.toolbar__path {
  max-width: 40%;
}

.app-shell__main {
  min-height: 0;
}

.workspace {
  height: 100%;
  min-height: 0;
  gap: 0;
  overflow: hidden;
}

.workspace__content {
  min-width: 0;
}
</style>
