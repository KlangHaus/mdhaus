<script setup lang="ts">
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

const items: MarkdownGuideItem[] = [
  {
    title: "Overskrifter",
    description: "Brug # til overskrifter. Flere # giver mindre overskrift.",
    syntax: "# Overskrift 1\n## Overskrift 2\n### Overskrift 3",
  },
  {
    title: "Fed og kursiv",
    description: "Fremhæv tekst med fed, kursiv eller begge dele.",
    syntax: "**fed tekst**\n*kursiv tekst*\n***fed og kursiv***",
  },
  {
    title: "Lister",
    description: "Punktlister med - eller *. Nummererede med tal og punktum.",
    syntax: "- Punkt ét\n- Punkt to\n  - Underpunkt\n\n1. Første\n2. Anden",
  },
  {
    title: "Links",
    description: "Link til websider eller filer med visningstekst i klammer.",
    syntax: "[Grundtone](https://grundtone.com)\n[Relativ sti](./docs/README.md)",
  },
  {
    title: "Billeder",
    description: "Samme syntaks som links, men med udråbstegn foran.",
    syntax: "![Alternativ tekst](./billede.png)",
  },
  {
    title: "Kode",
    description: "Inline kode med backticks. Kodeblok med tre backticks.",
    syntax: "Brug `npm install` i terminalen.\n\n```rust\nfn main() {\n    println!(\"Hej\");\n}\n```",
  },
  {
    title: "Citat",
    description: "Citer tekst med > i starten af linjen.",
    syntax: "> Dette er et citat.\n> Det kan gå over flere linjer.",
  },
  {
    title: "Tabel",
    description: "Kolonner adskilles med |. Header-rækken følges af en separator.",
    syntax: "| Kolonne | Værdi |\n| ------- | ----- |\n| Navn    | open mdHaus |",
  },
  {
    title: "Vandret linje",
    description: "Adskil sektioner med tre bindestreger på en linje.",
    syntax: "---",
  },
  {
    title: "Opgaveliste",
    description: "Markdown-opgaver med - [ ] og - [x].",
    syntax: "- [ ] Todo\n- [x] Færdig",
  },
];
</script>

<template>
  <section class="markdown-guide">
    <header v-if="showHeader" class="markdown-guide__header">
      <h2 class="markdown-guide__title">Markdown-syntaks</h2>
      <p class="markdown-guide__intro text-secondary">
        Hurtig reference til de mest brugte elementer. Kopiér eksemplerne ind i editoren til venstre.
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
