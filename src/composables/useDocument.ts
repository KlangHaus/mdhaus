import { computed, onMounted, onUnmounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";

export interface OpenedDocument {
  path: string;
  content: string;
}

export function useDocument() {
  const content = ref(
    "# Welcome to MdHaus\n\nWrite Markdown on the left. Preview updates live on the right.\n\n## Features\n\n- Split-pane editor and preview\n- Native macOS app powered by **Tauri** and **Rust**\n- Styled with [Grundtone](https://grundtone.com)\n\n```rust\n#[tauri::command]\nfn greet(name: &str) -> String {\n    format!(\"Hello, {name}!\")\n}\n```\n",
  );
  const filePath = ref<string | null>(null);
  const dirty = ref(false);
  const status = ref("Ready");

  const title = computed(() => {
    const name = filePath.value?.split("/").pop() ?? "Untitled";
    return `${dirty.value ? "• " : ""}${name} — MdHaus`;
  });

  function setContent(value: string) {
    content.value = value;
    dirty.value = true;
  }

  async function openFile() {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdx", "txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    status.value = "Opening…";
    try {
      const doc = await invoke<OpenedDocument>("read_markdown_file", { path: selected });
      filePath.value = doc.path;
      content.value = doc.content;
      dirty.value = false;
      status.value = `Opened ${doc.path.split("/").pop()}`;
    } catch (error) {
      status.value = `Open failed: ${String(error)}`;
    }
  }

  async function saveFile(forceDialog = false) {
    let target = filePath.value;

    if (!target || forceDialog) {
      const selected = await save({
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "All Files", extensions: ["*"] },
        ],
        defaultPath: filePath.value ?? "untitled.md",
      });

      if (!selected) {
        return;
      }

      target = selected;
    }

    status.value = "Saving…";
    try {
      const saved = await invoke<OpenedDocument>("write_markdown_file", {
        path: target,
        content: content.value,
      });
      filePath.value = saved.path;
      dirty.value = false;
      status.value = `Saved ${saved.path.split("/").pop()}`;
    } catch (error) {
      status.value = `Save failed: ${String(error)}`;
    }
  }

  let unlisteners: UnlistenFn[] = [];

  onMounted(async () => {
    unlisteners = await Promise.all([
      listen("menu-open", () => openFile()),
      listen("menu-save", () => saveFile(false)),
      listen("menu-save-as", () => saveFile(true)),
    ]);
  });

  onUnmounted(() => {
    unlisteners.forEach((unlisten) => unlisten());
  });

  return {
    content,
    dirty,
    filePath,
    setContent,
    openFile,
    saveFile,
    status,
    title,
  };
}
