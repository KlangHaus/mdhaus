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
  toggleFocusMode?: () => void;
  openFind?: () => void;
  showShortcuts: () => void;
  closeOverlay: () => void;
}

export interface KeyboardShortcutOptions {
  syntaxOpen: Ref<boolean>;
  frontMatterOpen: Ref<boolean>;
  shortcutsOpen: Ref<boolean>;
  instructionsOpen: Ref<boolean>;
  focusMode?: Ref<boolean>;
  diffOpen?: Ref<boolean>;
  commitOpen?: Ref<boolean>;
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
      if (options.commitOpen?.value) {
        event.preventDefault();
        options.commitOpen.value = false;
        return;
      }

      if (options.diffOpen?.value) {
        event.preventDefault();
        options.diffOpen.value = false;
        return;
      }

      if (options.focusMode?.value) {
        event.preventDefault();
        actions.closeOverlay();
        return;
      }

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
        return;
      }

      if (options.frontMatterOpen.value) {
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

    if (key === "f" && !shift && !alt) {
      event.preventDefault();
      actions.openFind?.();
      return;
    }

    if (key === "\\" && !shift && !alt) {
      event.preventDefault();
      actions.toggleSyntax();
      return;
    }

    if (key === "enter" && shift && !alt) {
      event.preventDefault();
      actions.toggleFocusMode?.();
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
