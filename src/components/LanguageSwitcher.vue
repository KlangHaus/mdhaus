<script setup lang="ts">
import { computed } from "vue";
import { GTOverflowMenu, type OverflowMenuItem } from "@grundtone/vue";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "../i18n/types";
import { useI18n } from "../i18n/useI18n";

const { locale, setLocale, t } = useI18n();

const currentLabel = computed(() => (locale.value ?? DEFAULT_LOCALE).toUpperCase());

const items = computed(() =>
  SUPPORTED_LOCALES.map((code) => ({
    label: t(`languages.${code}`),
    value: code,
    active: code === locale.value,
  })),
);

function onSelect(item: OverflowMenuItem) {
  if (item.value) {
    setLocale(item.value as Locale);
  }
}
</script>

<template>
  <GTOverflowMenu
    class="language-switcher"
    :label="currentLabel"
    align="right"
    :items="items"
    :aria-label="t('toolbar.language')"
    @select="onSelect"
  />
</template>
