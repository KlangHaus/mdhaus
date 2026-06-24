<script setup lang="ts">
import { computed } from "vue";
import {
  GTOverflowMenu,
  useTheme,
  type OverflowMenuItem,
  type ThemeMode,
} from "@grundtone/vue";
import { useI18n } from "../i18n/useI18n";

const { mode, setMode } = useTheme();
const { t } = useI18n();

const THEME_MODES: ThemeMode[] = ["light", "dark", "auto"];

const MODE_SYMBOLS: Record<ThemeMode, string> = {
  light: "☀️",
  dark: "🌙",
  auto: "◐",
};

const currentLabel = computed(() => MODE_SYMBOLS[mode.value ?? "auto"]);

const items = computed(() =>
  THEME_MODES.map((value) => ({
    label: t(`themes.${value}`),
    value,
    active: value === (mode.value ?? "auto"),
  })),
);

function onSelect(item: OverflowMenuItem) {
  if (item.value === "light" || item.value === "dark" || item.value === "auto") {
    setMode(item.value);
  }
}
</script>

<template>
  <GTOverflowMenu
    class="theme-switcher"
    :label="currentLabel"
    align="right"
    :items="items"
    :aria-label="t('toolbar.theme')"
    @select="onSelect"
  />
</template>
