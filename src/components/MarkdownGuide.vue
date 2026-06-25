<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../i18n/useI18n";

withDefaults(
  defineProps<{
    showHeader?: boolean;
  }>(),
  {
    showHeader: true,
  },
);
export interface MarkdownGuideItem {
  title: string;
  description: string;
  syntax: string;
}

const { locale } = useI18n();

const guideByLocale: Record<string, MarkdownGuideItem[]> = {
  da: [
    { title: "Overskrifter", description: "Brug # til overskrifter.", syntax: "# Overskrift 1\n## Overskrift 2" },
    { title: "Fed og kursiv", description: "Fremhæv tekst med markdown.", syntax: "**fed**\n*kursiv*" },
    { title: "Lister", description: "Brug - eller 1. til lister.", syntax: "- Punkt\n- Underpunkt" },
  ],
  en: [
    { title: "Headings", description: "Use # markers for heading levels.", syntax: "# Heading 1\n## Heading 2" },
    { title: "Bold and italic", description: "Emphasize text with markdown.", syntax: "**bold**\n*italic*" },
    { title: "Lists", description: "Use - or 1. for list items.", syntax: "- Item\n- Sub item" },
  ],
  de: [
    { title: "Überschriften", description: "Nutze # für Überschriften.", syntax: "# Überschrift 1\n## Überschrift 2" },
    { title: "Fett und kursiv", description: "Text mit Markdown hervorheben.", syntax: "**fett**\n*kursiv*" },
    { title: "Listen", description: "Nutze - oder 1. für Listen.", syntax: "- Punkt\n- Unterpunkt" },
  ],
  es: [
    { title: "Encabezados", description: "Usa # para encabezados.", syntax: "# Encabezado 1\n## Encabezado 2" },
    { title: "Negrita y cursiva", description: "Resalta texto con markdown.", syntax: "**negrita**\n*cursiva*" },
    { title: "Listas", description: "Usa - o 1. para listas.", syntax: "- Elemento\n- Sub elemento" },
  ],
  nb: [
    { title: "Overskrifter", description: "Bruk # for overskrifter.", syntax: "# Overskrift 1\n## Overskrift 2" },
    { title: "Fet og kursiv", description: "Marker tekst med markdown.", syntax: "**fet**\n*kursiv*" },
    { title: "Lister", description: "Bruk - eller 1. for lister.", syntax: "- Punkt\n- Underpunkt" },
  ],
  sv: [
    { title: "Rubriker", description: "Använd # för rubriker.", syntax: "# Rubrik 1\n## Rubrik 2" },
    { title: "Fet och kursiv", description: "Framhäv text med markdown.", syntax: "**fet**\n*kursiv*" },
    { title: "Listor", description: "Använd - eller 1. för listor.", syntax: "- Punkt\n- Delpunkt" },
  ],
};

const items = computed(() => {
  const currentLocale = locale.value ?? "en";
  return guideByLocale[currentLocale] ?? guideByLocale.en;
});
</script>

<template>
  <section class="markdown-guide">
    <header v-if="showHeader" class="markdown-guide__header">
      <h2 class="markdown-guide__title">Markdown</h2>
      <p class="markdown-guide__intro text-secondary">
        Localized quick reference.
      </p>
    </header>

    <ul class="markdown-guide__list">
      <li v-for="item in items" :key="item.title" class="markdown-guide__item">
        <h3 class="markdown-guide__item-title">{{ item.title }}</h3>
        <p class="markdown-guide__item-desc text-secondary">{{ item.description }}</p>
        <pre class="markdown-guide__code"><code>{{ item.syntax }}</code></pre>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.markdown-guide {
  height: 100%;
  overflow: auto;
  padding: 12px 16px 20px;
  background: transparent;
  color: var(--color-text, #111118);
}

.markdown-guide__header {
  margin-bottom: 20px;
}

.markdown-guide__title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 700;
}

.markdown-guide__intro {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.markdown-guide__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.markdown-guide__item {
  margin: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-light, #e4e4ec);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.markdown-guide__item-title {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
}

.markdown-guide__item-desc {
  margin: 0 0 10px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.markdown-guide__code {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light, #e4e4ec);
  background: var(--color-surface-alt, #f4f4f8);
  overflow-x: auto;
  font-family: var(--font-family-mono, ui-monospace, Menlo, monospace);
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--color-text, #111118);
  white-space: pre-wrap;
  word-break: break-word;

  code {
    font-family: inherit;
  }
}
</style>
