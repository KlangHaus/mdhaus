import { ref, type App, type InjectionKey } from "vue";
import da from "./locales/da";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import nb from "./locales/nb";
import sv from "./locales/sv";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
  type MessageSchema,
  type ShortcutGroup,
  type InstructionSection,
} from "./types";

const messages: Record<Locale, MessageSchema> = { da, sv, nb, en, de, es };

function loadPersistedLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  const browser = navigator.language.slice(0, 2);
  if (browser === "no") {
    return "nb";
  }

  if (SUPPORTED_LOCALES.includes(browser as Locale)) {
    return browser as Locale;
  }

  return DEFAULT_LOCALE;
}

function getNestedValue(source: MessageSchema, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object" && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

export interface I18nContext {
  locale: ReturnType<typeof ref<Locale>>;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => void;
  shortcutGroups: () => ShortcutGroup[];
  instructionSections: () => InstructionSection[];
}

export const I18N_KEY: InjectionKey<I18nContext> = Symbol("open-mdhaus-i18n");

const locale = ref<Locale>(loadPersistedLocale());

function translate(key: string, params?: Record<string, string | number>): string {
  let value = getNestedValue(messages[locale.value], key);

  if (typeof value !== "string") {
    value = getNestedValue(messages.en, key);
  }

  if (typeof value !== "string") {
    return key;
  }

  return interpolate(value, params);
}

function setLocale(next: Locale) {
  locale.value = next;
  localStorage.setItem(LOCALE_STORAGE_KEY, next);
  document.documentElement.lang = next === "nb" ? "nb" : next;
}

document.documentElement.lang = locale.value === "nb" ? "nb" : locale.value;

function shortcutGroups(): ShortcutGroup[] {
  return [
    {
      title: translate("shortcuts.files"),
      items: [
        { keys: "⌘O", label: translate("shortcuts.openFile") },
        { keys: "⌘⇧O", label: translate("shortcuts.openFolder") },
        { keys: "⌘S", label: translate("shortcuts.save") },
        { keys: "⌘⇧S", label: translate("shortcuts.saveAs") },
        { keys: "⌘P", label: translate("shortcuts.print") },
        { keys: "⌥⌘↓", label: translate("shortcuts.nextFile") },
        { keys: "⌥⌘↑", label: translate("shortcuts.prevFile") },
      ],
    },
    {
      title: translate("shortcuts.view"),
      items: [
        { keys: "⌘\\", label: translate("shortcuts.toggleSyntax") },
        { keys: "⌘/", label: translate("shortcuts.showShortcuts") },
        { keys: "Esc", label: translate("shortcuts.closePanel") },
      ],
    },
  ];
}

function instructionSections(): InstructionSection[] {
  const m = messages[locale.value].instructions;
  return [
    { title: m.gettingStarted, items: [...m.gettingStartedItems] },
    { title: m.quickTools, items: [...m.quickToolsItems] },
    { title: m.liveSync, items: [...m.liveSyncItems] },
    { title: m.navigation, items: [...m.navigationItems] },
  ];
}

export function createI18n(): I18nContext {
  return {
    locale,
    t: translate,
    setLocale,
    shortcutGroups,
    instructionSections,
  };
}

export function installI18n(app: App) {
  const i18n = createI18n();
  app.provide(I18N_KEY, i18n);
}
