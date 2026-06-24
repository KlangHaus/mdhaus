import { onMounted, onUnmounted, type Ref } from "vue";

export interface KeyboardShortcutActions {
  openFile: () => void;
  openFolder: () => void;
  saveFile: () => void;
  saveAs: () => void;
  printDocument: () => void;
  openNextFile: () => void;
  openPreviousFile: () => void;
  toggleSyntax: () => void;
  showShortcuts: () => void;
  closeOverlay: () => void;
}

export interface KeyboardShortcutOptions {
  syntaxOpen: Ref<boolean>;
  shortcutsOpen: Ref<boolean>;
  instructionsOpen: Ref<boolean>;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function isModifierPressed(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions, options: KeyboardShortcutOptions) {
  function onKeyDown(event: KeyboardEvent) {
    const mod = isModifierPressed(event);
    const key = event.key.toLowerCase();

    if (event.key === "Escape") {
      if (options.shortcutsOpen.value) {
        event.preventDefault();
        actions.closeOverlay();
        return;
      }

      if (options.instructionsOpen.value) {
        event.preventDefault();
        actions.closeOverlay();
        return;
      }

      if (options.syntaxOpen.value) {
        event.preventDefault();
        actions.closeOverlay();
      }
      return;
    }

    if (!mod) {
      if (event.key === "?" && event.shiftKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        actions.showShortcuts();
      }
      return;
    }

    const alt = event.altKey;
    const shift = event.shiftKey;

    if (key === "o" && shift && !alt) {
      event.preventDefault();
      actions.openFolder();
      return;
    }

    if (key === "o" && !shift && !alt) {
      event.preventDefault();
      actions.openFile();
      return;
    }

    if (key === "s" && shift && !alt) {
      event.preventDefault();
      actions.saveAs();
      return;
    }

    if (key === "s" && !shift && !alt) {
      event.preventDefault();
      actions.saveFile();
      return;
    }

    if (key === "p" && !shift && !alt) {
      event.preventDefault();
      actions.printDocument();
      return;
    }

    if (mod && alt && !shift && event.key === "ArrowDown") {
      event.preventDefault();
      actions.openNextFile();
      return;
    }

    if (mod && alt && !shift && event.key === "ArrowUp") {
      event.preventDefault();
      actions.openPreviousFile();
      return;
    }

    if (key === "\\" && !shift && !alt) {
      event.preventDefault();
      actions.toggleSyntax();
      return;
    }

    if ((key === "/" || (key === "?" && shift)) && !alt) {
      event.preventDefault();
      actions.showShortcuts();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeyDown, true);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown, true);
  });
}
