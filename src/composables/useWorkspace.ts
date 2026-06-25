import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open, save, confirm } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../i18n/useI18n";
import type { FileTreeNode, MarkdownDocument } from "../types/files";
import type {
  ExternalChange,
  WorkspaceFileChanged,
  WorkspaceTreeChanged,
} from "../types/workspace";
import type { RecentFileEntry } from "../types/recent";
import type { WorkspaceGitInfo } from "../types/git";
import { flattenMarkdownFiles, flattenDirectoryPaths, nextUntitledFolderPath, nextUntitledPath } from "../lib/fileTree";
import {
  forgetRecentFile,
  forgetRecentFolder,
  getRecentFiles,
  getRecentFolders,
  recordRecentFile,
  recordRecentFolder,
  renameRecentFile,
} from "../lib/recentPaths";
import {
  loadFavouriteFiles,
  removeFavouriteFile,
  replaceFavouriteFilePath,
  toggleFavouriteFile,
} from "../lib/favorites";
import {
  buildHtmlDocument,
  defaultHtmlExportPath,
  ExportHtmlDocumentError,
} from "../lib/exportHtmlDocument";
import { PrintDocumentError, printMarkdownDocument } from "../lib/printDocument";
import { extractHeadings } from "../lib/headings";
import { APP_NAME } from "../lib/brand";

const MARKDOWN_EXTENSIONS = ["md", "markdown", "mdx", "txt"];

function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

function isValidFileName(name: string): boolean {
  if (name.trim().length === 0) {
    return false;
  }

  return !name.includes("/") && !name.includes("\\");
}

function isValidRelativePath(path: string): boolean {
  if (path.trim().length === 0) {
    return false;
  }

  if (path.startsWith("/") || path.includes("\\")) {
    return false;
  }

  const segments = path.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

function defaultTocExportPath(path: string | null): string {
  if (!path) {
    return "toc.md";
  }

  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  if (lastDot > lastSlash) {
    return `${path.slice(0, lastDot)}.toc.md`;
  }

  return `${path}.toc.md`;
}

function buildMarkdownToc(source: string): string {
  const headings = extractHeadings(source);
  if (headings.length === 0) {
    return "";
  }

  return headings
    .map((heading) => `${"  ".repeat(Math.max(0, heading.level - 1))}- [${heading.text}](#${heading.id})`)
    .join("\n");
}

export function useWorkspace() {
  const { t, locale } = useI18n();

  const content = ref("");
  const filePath = ref<string | null>(null);
  const workspaceRoot = ref<string | null>(null);
  const fileTree = shallowRef<FileTreeNode[]>([]);
  const dirty = ref(false);
  const status = ref("");
  const loadingPath = ref<string | null>(null);
  const externalChange = ref<ExternalChange | null>(null);

  const dirtyPathMap = ref<Record<string, boolean>>({});
  const contentCache = new Map<string, string>();
  const cacheRevision = ref(0);
  const recentFolders = ref(getRecentFolders());
  const recentFiles = ref(getRecentFiles());
  const workspaceGitInfo = ref<WorkspaceGitInfo | null>(null);
  const workspaceGitChangedPaths = ref<Record<string, boolean>>({});
  const favouriteFiles = ref<string[]>(loadFavouriteFiles());

  function touchRecentFolder(path: string) {
    recentFolders.value = recordRecentFolder(path);
  }

  function touchRecentFile(path: string) {
    let root = workspaceRoot.value;
    if (!root || !path.startsWith(`${root}/`)) {
      root = dirname(path);
    }

    if (root.length === 0) {
      return;
    }

    recentFiles.value = recordRecentFile(path, root);
  }

  function bumpCacheRevision() {
    cacheRevision.value += 1;
  }

  function getCachedContents(): Record<string, string> {
    return Object.fromEntries(contentCache);
  }

  function buildWelcomeContent() {
    return `# ${t("welcome.title")}\n\n${t("welcome.body")}\n`;
  }

  function resetWelcome() {
    content.value = buildWelcomeContent();
    filePath.value = null;
    dirty.value = false;
  }

  resetWelcome();
  status.value = t("status.ready");

  watch(locale, () => {
    status.value = t("status.ready");
    if (!filePath.value) {
      content.value = buildWelcomeContent();
    }
  });

  function markDirty(path: string) {
    dirtyPathMap.value[path] = true;
  }

  function clearDirty(path: string) {
    if (!dirtyPathMap.value[path]) {
      return;
    }

    const next = { ...dirtyPathMap.value };
    delete next[path];
    dirtyPathMap.value = next;
  }

  function isDirtyPath(path: string): boolean {
    return !!dirtyPathMap.value[path];
  }

  const title = computed(() => {
    const name = filePath.value ? basename(filePath.value) : t("files.untitledShort");
    return `${dirty.value ? "• " : ""}${name} — ${APP_NAME}`;
  });

  const workspaceLabel = computed(() => {
    if (!workspaceRoot.value) {
      return t("files.noFolder");
    }
    return basename(workspaceRoot.value);
  });

  const workspaceFiles = computed(() => flattenMarkdownFiles(fileTree.value));

  function rememberCurrentFile() {
    if (!filePath.value) {
      return;
    }

    contentCache.set(filePath.value, content.value);
    bumpCacheRevision();
    if (dirty.value) {
      markDirty(filePath.value);
    } else {
      clearDirty(filePath.value);
    }
  }

  function setContent(value: string) {
    content.value = value;
    dirty.value = true;

    if (filePath.value) {
      contentCache.set(filePath.value, value);
      bumpCacheRevision();
      markDirty(filePath.value);
    }
  }

  function applyDiskContent(path: string, diskContent: string) {
    contentCache.set(path, diskContent);
    bumpCacheRevision();

    if (filePath.value === path) {
      content.value = diskContent;
      dirty.value = false;
      clearDirty(path);
    }
  }

  async function startWorkspaceWatch(root: string) {
    try {
      await invoke("start_workspace_watch", { root });
    } catch (error) {
      status.value = t("status.watchFailed", { error: String(error) });
    }
  }

  async function refreshWorkspaceGitInfo() {
    if (!workspaceRoot.value) {
      workspaceGitInfo.value = null;
      return;
    }

    try {
      workspaceGitInfo.value = await invoke<WorkspaceGitInfo | null>("read_workspace_git_info", {
        workspacePath: workspaceRoot.value,
      });
    } catch {
      workspaceGitInfo.value = null;
    }
  }

  async function refreshWorkspaceGitChangedPaths() {
    if (!workspaceRoot.value) {
      workspaceGitChangedPaths.value = {};
      return;
    }

    try {
      const changed = await invoke<string[]>("read_workspace_git_changed_paths", {
        workspacePath: workspaceRoot.value,
      });
      workspaceGitChangedPaths.value = Object.fromEntries(changed.map((path) => [path, true]));
    } catch {
      workspaceGitChangedPaths.value = {};
    }
  }

  async function refreshWorkspaceGitState() {
    await Promise.all([refreshWorkspaceGitInfo(), refreshWorkspaceGitChangedPaths()]);
  }

  async function refreshWorkspaceTree() {
    if (!workspaceRoot.value) {
      return;
    }

    try {
      const tree = await invoke<FileTreeNode[]>("list_markdown_tree", { root: workspaceRoot.value });
      fileTree.value = tree;
      await refreshWorkspaceGitState();
    } catch (error) {
      status.value = t("status.treeRefreshFailed", { error: String(error) });
    }
  }

  async function openFolderAt(root: string) {
    status.value = t("status.scanning");
    try {
      const tree = await invoke<FileTreeNode[]>("list_markdown_tree", { root });
      workspaceRoot.value = root;
      fileTree.value = tree;
      await startWorkspaceWatch(root);
      touchRecentFolder(root);
      await refreshWorkspaceGitState();
      status.value = t("status.openedFolder", { name: basename(root) });
    } catch (error) {
      status.value = t("status.folderScanFailed", { error: String(error) });
    }
  }

  async function openFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    await openFolderAt(selected);
  }

  async function openFile() {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Markdown", extensions: MARKDOWN_EXTENSIONS },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    rememberCurrentFile();
    status.value = t("status.opening");

    try {
      const doc = await invoke<MarkdownDocument>("read_markdown_file", { path: selected });
      contentCache.set(doc.path, doc.content);
      bumpCacheRevision();
      filePath.value = doc.path;
      content.value = doc.content;
      dirty.value = false;
      touchRecentFile(doc.path);
      status.value = t("status.openedFile", { name: basename(doc.path) });
    } catch (error) {
      status.value = t("status.openFailed", { error: String(error) });
    }
  }

  async function openAdjacentFile(direction: 1 | -1) {
    const files = workspaceFiles.value;
    if (files.length === 0) {
      status.value = t("status.noFilesInWorkspace");
      return;
    }

    const currentIndex = filePath.value ? files.indexOf(filePath.value) : -1;
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : files.length - 1
        : (currentIndex + direction + files.length) % files.length;

    await openFileFromTree(files[nextIndex]);
  }

  async function openNextFile() {
    await openAdjacentFile(1);
  }

  async function openPreviousFile() {
    await openAdjacentFile(-1);
  }

  async function openFileFromTree(path: string): Promise<boolean> {
    if (filePath.value === path) {
      return true;
    }

    rememberCurrentFile();
    loadingPath.value = path;

    try {
      if (contentCache.has(path)) {
        content.value = contentCache.get(path) ?? "";
        filePath.value = path;
        dirty.value = isDirtyPath(path);
        touchRecentFile(path);
        status.value = t("status.openedFile", { name: basename(path) });
        return true;
      }

      status.value = t("status.opening");
      const doc = await invoke<MarkdownDocument>("read_markdown_file", { path });
      contentCache.set(path, doc.content);
      bumpCacheRevision();
      content.value = doc.content;
      filePath.value = path;
      dirty.value = false;
      touchRecentFile(doc.path);
      status.value = t("status.openedFile", { name: basename(doc.path) });
      return true;
    } catch (error) {
      status.value = t("status.openFailed", { error: String(error) });
      return false;
    } finally {
      loadingPath.value = null;
    }
  }

  async function openRecentFolder(path: string) {
    rememberCurrentFile();
    await openFolderAt(path);
    if (workspaceRoot.value !== path) {
      recentFolders.value = forgetRecentFolder(path);
    }
  }

  async function openRecentFile(entry: RecentFileEntry) {
    rememberCurrentFile();

    if (workspaceRoot.value !== entry.workspaceRoot) {
      await openFolderAt(entry.workspaceRoot);
      if (workspaceRoot.value !== entry.workspaceRoot) {
        return;
      }
    }

    const opened = await openFileFromTree(entry.path);
    if (!opened) {
      recentFiles.value = forgetRecentFile(entry.path);
    }
  }

  function getCreateFolderParent(): string {
    if (!workspaceRoot.value) {
      return "";
    }

    if (filePath.value) {
      const parent = dirname(filePath.value);
      if (parent === workspaceRoot.value || parent.startsWith(`${workspaceRoot.value}/`)) {
        return parent;
      }
    }

    return workspaceRoot.value;
  }

  function suggestNewFolderName(): string {
    if (!workspaceRoot.value) {
      return "untitled-folder";
    }

    const parent = getCreateFolderParent();
    const path = nextUntitledFolderPath(parent, flattenDirectoryPaths(fileTree.value));
    return basename(path);
  }

  async function createNewFile() {
    if (!workspaceRoot.value) {
      status.value = t("status.chooseFolderFirst");
      return;
    }

    rememberCurrentFile();

    const path = nextUntitledPath(workspaceRoot.value, workspaceFiles.value);
    const initialContent = "# Untitled\n\n";

    status.value = t("status.creatingFile");
    try {
      const saved = await invoke<MarkdownDocument>("write_markdown_file", {
        path,
        content: initialContent,
      });
      await invoke("notify_file_saved", { path: saved.path });
      await refreshWorkspaceTree();
      contentCache.set(saved.path, saved.content);
      bumpCacheRevision();
      filePath.value = saved.path;
      content.value = saved.content;
      dirty.value = false;
      touchRecentFile(saved.path);
      status.value = t("status.createdFile", { name: basename(saved.path) });
    } catch (error) {
      status.value = t("status.createFileFailed", { error: String(error) });
    }
  }

  async function createNewFolder(folderName: string) {
    if (!workspaceRoot.value) {
      status.value = t("status.chooseFolderFirst");
      return;
    }

    const trimmed = folderName.trim();
    if (!isValidFileName(trimmed)) {
      status.value = t("status.invalidFileName");
      return;
    }

    const parent = getCreateFolderParent();
    const target = `${parent}/${trimmed}`;

    status.value = t("status.creatingFolder");
    try {
      await invoke<string>("create_markdown_folder", { path: target });
      await refreshWorkspaceTree();
      status.value = t("status.createdFolder", { name: trimmed });
    } catch (error) {
      const message = String(error);
      status.value =
        message.includes("Destination already exists")
          ? t("status.folderExists")
          : t("status.createFolderFailed", { error: message });
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

    status.value = t("status.saving");
    try {
      const saved = await invoke<MarkdownDocument>("write_markdown_file", {
        path: target,
        content: content.value,
      });
      filePath.value = saved.path;
      contentCache.set(saved.path, saved.content);
      bumpCacheRevision();
      clearDirty(saved.path);
      dirty.value = false;
      touchRecentFile(saved.path);
      await invoke("notify_file_saved", { path: saved.path });
      status.value = t("status.savedFile", { name: basename(saved.path) });
      await refreshWorkspaceGitChangedPaths();
    } catch (error) {
      status.value = t("status.saveFailed", { error: String(error) });
    }
  }

  function handleWorkspaceFileChanged(payload: WorkspaceFileChanged) {
    const { path, content: diskContent } = payload;

    if (filePath.value !== path) {
      if (!isDirtyPath(path)) {
        contentCache.set(path, diskContent);
        bumpCacheRevision();
      }
      return;
    }

    if (diskContent === content.value) {
      return;
    }

    if (!dirty.value) {
      applyDiskContent(path, diskContent);
      status.value = t("status.reloadedFromDisk", { name: basename(path) });
      return;
    }

    externalChange.value = { path, content: diskContent };
  }

  function keepExternalChanges() {
    externalChange.value = null;
    status.value = t("status.keptUnsaved");
  }

  function reloadExternalChanges() {
    if (!externalChange.value) {
      return;
    }

    const { path, content: diskContent } = externalChange.value;
    applyDiskContent(path, diskContent);
    externalChange.value = null;
    status.value = t("status.reloadedFromDisk", { name: basename(path) });
  }

  function migrateFilePath(from: string, to: string) {
    if (contentCache.has(from)) {
      contentCache.set(to, contentCache.get(from) ?? "");
      contentCache.delete(from);
      bumpCacheRevision();
    }

    if (dirtyPathMap.value[from]) {
      const next = { ...dirtyPathMap.value };
      delete next[from];
      next[to] = true;
      dirtyPathMap.value = next;
    }

    if (filePath.value === from) {
      filePath.value = to;
      dirty.value = isDirtyPath(to);
    }
  }

  async function renameFile(from: string, newPath: string) {
    const trimmed = newPath.trim();
    if (!isValidRelativePath(trimmed)) {
      status.value = t("status.invalidFileName");
      return;
    }

    let to = "";
    if (trimmed.includes("/")) {
      if (!workspaceRoot.value) {
        status.value = t("status.invalidFileName");
        return;
      }
      to = `${workspaceRoot.value}/${trimmed}`;
    } else {
      const parent = dirname(from);
      to = parent ? `${parent}/${trimmed}` : trimmed;
    }

    if (to === from) {
      return;
    }

    status.value = t("status.saving");
    try {
      const renamedPath = await invoke<string>("rename_markdown_path", { from, to });
      migrateFilePath(from, renamedPath);
      recentFiles.value = renameRecentFile(from, renamedPath);
      favouriteFiles.value = replaceFavouriteFilePath(from, renamedPath);
      await refreshWorkspaceTree();
      status.value = t("status.renamedFile", { name: basename(renamedPath) });
    } catch (error) {
      const message = String(error);
      status.value =
        message.includes("Destination already exists")
          ? t("status.fileExists")
          : t("status.renameFailed", { error: message });
    }
  }

  async function deleteFile(path: string) {
    const name = basename(path);
    const hasUnsaved = isDirtyPath(path) || (filePath.value === path && dirty.value);

    const confirmed = await confirm(t("files.deleteConfirmBody", { name }), {
      title: t("files.deleteConfirmTitle"),
      kind: "warning",
    });

    if (!confirmed) {
      return;
    }

    if (hasUnsaved) {
      const forceDelete = await confirm(t("files.deleteDirtyBody", { name }), {
        title: t("files.deleteDirtyTitle"),
        kind: "warning",
      });

      if (!forceDelete) {
        return;
      }
    }

    try {
      await invoke("delete_markdown_path", { path });
      contentCache.delete(path);
      bumpCacheRevision();
      clearDirty(path);
      recentFiles.value = forgetRecentFile(path);
      favouriteFiles.value = removeFavouriteFile(path);

      if (filePath.value === path) {
        const remaining = workspaceFiles.value.filter((candidate) => candidate !== path);
        if (remaining.length > 0) {
          await openFileFromTree(remaining[0]);
        } else {
          resetWelcome();
        }
      }

      await refreshWorkspaceTree();
      status.value = t("status.deletedFile", { name });
    } catch (error) {
      status.value = t("status.deleteFailed", { error: String(error) });
    }
  }

  async function exportCurrentDocumentToHtml() {
    if (content.value.trim().length === 0) {
      status.value = t("status.exportHtmlEmpty");
      return;
    }

    const selected = await save({
      filters: [
        { name: "HTML", extensions: ["html", "htm"] },
        { name: "All Files", extensions: ["*"] },
      ],
      defaultPath: defaultHtmlExportPath(filePath.value),
    });

    if (!selected) {
      return;
    }

    status.value = t("status.exportingHtml");

    try {
      const docTitle = filePath.value ? basename(filePath.value) : t("files.untitledShort");
      const html = await buildHtmlDocument({
        title: docTitle.replace(/\.[^./]+$/, "") || docTitle,
        markdown: content.value,
        lang: document.documentElement.lang,
        workspaceFiles: workspaceFiles.value,
        currentFilePath: filePath.value,
      });
      const saved = await invoke<MarkdownDocument>("write_markdown_file", {
        path: selected,
        content: html,
      });
      status.value = t("status.exportedHtml", { name: basename(saved.path) });
    } catch (error) {
      if (error instanceof ExportHtmlDocumentError && error.message === "empty") {
        status.value = t("status.exportHtmlEmpty");
        return;
      }

      status.value = t("status.exportHtmlFailed", { error: String(error) });
    }
  }

  async function printCurrentDocument() {
    if (content.value.trim().length === 0) {
      status.value = t("status.printEmpty");
      return;
    }

    const docTitle = filePath.value ? basename(filePath.value) : t("files.untitledShort");
    status.value = t("status.printing");

    try {
      await printMarkdownDocument({
        title: docTitle,
        markdown: content.value,
        lang: document.documentElement.lang,
        workspaceFiles: workspaceFiles.value,
        currentFilePath: filePath.value,
      });
      status.value = t("status.printed", { name: docTitle });
    } catch (error) {
      if (error instanceof PrintDocumentError && error.message === "empty") {
        status.value = t("status.printEmpty");
        return;
      }

      status.value = t("status.printFailed", { error: String(error) });
    }
  }

  async function exportCurrentDocumentToPdf() {
    if (content.value.trim().length === 0) {
      status.value = t("status.printEmpty");
      return;
    }

    status.value = t("status.printing");
    try {
      await printCurrentDocument();
      status.value = "PDF: brug printdialogens 'Gem som PDF'.";
    } catch (error) {
      status.value = t("status.printFailed", { error: String(error) });
    }
  }

  async function exportDocumentToc() {
    const toc = buildMarkdownToc(content.value);
    if (toc.length === 0) {
      status.value = "Ingen overskrifter at eksportere.";
      return;
    }

    const selected = await save({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] },
      ],
      defaultPath: defaultTocExportPath(filePath.value),
    });

    if (!selected) {
      return;
    }

    try {
      await invoke<MarkdownDocument>("write_markdown_file", {
        path: selected,
        content: `${toc}\n`,
      });
      status.value = `Eksporterede TOC til ${basename(selected)}.`;
    } catch (error) {
      status.value = `TOC-eksport mislykkedes: ${String(error)}`;
    }
  }

  let unlisteners: UnlistenFn[] = [];

  function toggleFavourite(path: string) {
    favouriteFiles.value = toggleFavouriteFile(path);
  }

  onMounted(async () => {
    unlisteners = await Promise.all([
      listen("menu-open", () => openFile()),
      listen("menu-open-folder", () => openFolder()),
      listen("menu-next-file", () => openNextFile()),
      listen("menu-prev-file", () => openPreviousFile()),
      listen("menu-save", () => saveFile(false)),
      listen("menu-save-as", () => saveFile(true)),
      listen("menu-print", () => printCurrentDocument()),
      listen("menu-export-html", () => exportCurrentDocumentToHtml()),
      listen("menu-export-pdf", () => exportCurrentDocumentToPdf()),
      listen("menu-export-toc", () => exportDocumentToc()),
      listen("workspace-file-changed", (event) =>
        handleWorkspaceFileChanged(event.payload as WorkspaceFileChanged),
      ),
      listen("workspace-tree-changed", async (event) => {
        const payload = event.payload as WorkspaceTreeChanged;
        if (payload.root === workspaceRoot.value) {
          await refreshWorkspaceTree();
        }
      }),
    ]);
  });

  onUnmounted(() => {
    unlisteners.forEach((unlisten) => unlisten());
    invoke("stop_workspace_watch").catch(() => undefined);
  });

  return {
    cacheRevision,
    content,
    dirty,
    dirtyPathMap,
    externalChange,
    filePath,
    fileTree,
    getCachedContents,
    isDirtyPath,
    keepExternalChanges,
    loadingPath,
    createNewFile,
    createNewFolder,
    suggestNewFolderName,
    deleteFile,
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
    workspaceFiles,
    workspaceGitChangedPaths,
    workspaceGitInfo,
    favouriteFiles,
    toggleFavourite,
    workspaceLabel,
    workspaceRoot,
  };
}
