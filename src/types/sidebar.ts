export const FILES_SIDEBAR_OPEN_KEY = "open-mdhaus-files-sidebar-open";
export const TOC_SIDEBAR_OPEN_KEY = "open-mdhaus-toc-sidebar-open";

export function loadSidebarOpen(storageKey: string, defaultOpen = true): boolean {
  const stored = localStorage.getItem(storageKey);
  if (stored === "true") {
    return true;
  }
  if (stored === "false") {
    return false;
  }

  return defaultOpen;
}

export function saveSidebarOpen(storageKey: string, open: boolean) {
  localStorage.setItem(storageKey, String(open));
}
