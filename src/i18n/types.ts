export type Locale = "da" | "sv" | "nb" | "en" | "de" | "es";

export const SUPPORTED_LOCALES: Locale[] = ["da", "sv", "nb", "en", "de", "es"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "open-mdhaus-locale";

export interface InstructionSection {
  title: string;
  items: string[];
}

export interface ShortcutItem {
  keys: string;
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export interface MessageSchema {
  languages: Record<Locale, string>;
  themes: {
    light: string;
    dark: string;
    auto: string;
  };
  layouts: {
    split: string;
    editor: string;
    preview: string;
  };
  toolbar: {
    openFolder: string;
    openFile: string;
    save: string;
    saveAs: string;
    print: string;
    exportHtml: string;
    syntax: string;
    syntaxHide: string;
    layout: string;
    instructions: string;
    shortcuts: string;
    unsaved: string;
    untitled: string;
    language: string;
    theme: string;
    metadata: string;
    metadataHide: string;
    fontSize: string;
    increaseFontSize: string;
    decreaseFontSize: string;
  };
  files: {
    title: string;
    new: string;
    newFolder: string;
    folder: string;
    search: string;
    searching: string;
    empty: string;
    noMatch: string;
    noFolder: string;
    unsaved: string;
    untitledShort: string;
    collapseSidebar: string;
    expandSidebar: string;
    favourite: string;
    favourites: string;
    rename: string;
    delete: string;
    renameTitle: string;
    renameLabel: string;
    renameConfirm: string;
    createFolderTitle: string;
    createFolderLabel: string;
    createFolderConfirm: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteDirtyTitle: string;
    deleteDirtyBody: string;
    recentFolders: string;
    recentFiles: string;
  };
  git: {
    statusLabel: string;
    branch: string;
    remote: string;
    openOnGitHub: string;
  };
  preview: {
    empty: string;
    rendering: string;
    tocTitle: string;
    collapseToc: string;
    expandToc: string;
  };
  syntax: {
    label: string;
    title: string;
    toggleShow: string;
    toggleHide: string;
    close: string;
  };
  frontMatter: {
    label: string;
    title: string;
    toggleShow: string;
    toggleHide: string;
    close: string;
    titleLabel: string;
    dateLabel: string;
    authorLabel: string;
    tagsLabel: string;
    tagsHint: string;
    emptyHint: string;
    insert: string;
  };
  splitPane: {
    resize: string;
  };
  modals: {
    close: string;
    shortcutsTitle: string;
    instructionsTitle: string;
    instructionsIntro: string;
    showShortcuts: string;
  };
  externalChange: {
    title: string;
    body: string;
    hint: string;
    keep: string;
    reload: string;
    keepAria: string;
  };
  shortcuts: {
    files: string;
    view: string;
    openFile: string;
    openFolder: string;
    save: string;
    saveAs: string;
    print: string;
    nextFile: string;
    prevFile: string;
    toggleSyntax: string;
    showShortcuts: string;
    closePanel: string;
  };
  instructions: {
    gettingStarted: string;
    quickTools: string;
    liveSync: string;
    navigation: string;
    gettingStartedItems: string[];
    quickToolsItems: string[];
    liveSyncItems: string[];
    navigationItems: string[];
  };
  welcome: {
    title: string;
    body: string;
  };
  stats: {
    wordsZero: string;
    words: string;
    reading: string;
  };
  status: {
    ready: string;
    scanning: string;
    openedFolder: string;
    folderScanFailed: string;
    watchFailed: string;
    treeRefreshFailed: string;
    chooseFolderFirst: string;
    creatingFile: string;
    createdFile: string;
    createFileFailed: string;
    creatingFolder: string;
    createdFolder: string;
    createFolderFailed: string;
    folderExists: string;
    wikilinkNotFound: string;
    opening: string;
    openedFile: string;
    openFailed: string;
    saving: string;
    savedFile: string;
    saveFailed: string;
    printing: string;
    printEmpty: string;
    printed: string;
    printFailed: string;
    exportingHtml: string;
    exportHtmlEmpty: string;
    exportedHtml: string;
    exportHtmlFailed: string;
    noFilesInWorkspace: string;
    reloadedFromDisk: string;
    keptUnsaved: string;
    renamedFile: string;
    renameFailed: string;
    deletedFile: string;
    deleteFailed: string;
    invalidFileName: string;
    fileExists: string;
  };
}

export type Messages = MessageSchema;
