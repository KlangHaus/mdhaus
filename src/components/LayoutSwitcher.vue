<script setup lang="ts">
import { computed } from "vue";
import { GTOverflowMenu, type OverflowMenuItem } from "@grundtone/vue";
import { PANE_LAYOUTS, type PaneLayout } from "../types/layout";
import { useI18n } from "../i18n/useI18n";

const layout = defineModel<PaneLayout>("layout", { default: "split" });
const { t } = useI18n();

const LAYOUT_SYMBOLS: Record<PaneLayout, string> = {
  split: "⊞",
  editor: "✎",
  preview: "◧",
};

const currentLabel = computed(() => LAYOUT_SYMBOLS[layout.value ?? "split"]);

const items = computed(() =>
  PANE_LAYOUTS.map((value) => ({
    label: t(`layouts.${value}`),
    value,
    active: value === (layout.value ?? "split"),
  })),
);

function onSelect(item: OverflowMenuItem) {
  if (item.value === "split" || item.value === "editor" || item.value === "preview") {
    layout.value = item.value;
  }
}
</script>

<template>
  <GTOverflowMenu
    class="layout-switcher"
    :label="currentLabel"
    align="right"
    :items="items"
    :aria-label="t('toolbar.layout')"
    @select="onSelect"
  />
</template>
