export type PaneLayout = "split" | "editor" | "preview";

export const PANE_LAYOUTS: PaneLayout[] = ["split", "editor", "preview"];

export const PANE_LAYOUT_STORAGE_KEY = "open-mdhaus-pane-layout";

export function loadPaneLayout(): PaneLayout {
  const stored = localStorage.getItem(PANE_LAYOUT_STORAGE_KEY);
  if (stored === "split" || stored === "editor" || stored === "preview") {
    return stored;
  }

  return "split";
}

export function savePaneLayout(layout: PaneLayout) {
  localStorage.setItem(PANE_LAYOUT_STORAGE_KEY, layout);
}
