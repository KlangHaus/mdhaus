<script setup lang="ts">
import { computed } from "vue";
import { getMarkdownGuideSections } from "../lib/markdownGuide";
import { useI18n } from "../i18n/useI18n";

withDefaults(
  defineProps<{
    showHeader?: boolean;
  }>(),
  {
    showHeader: true,
  },
);

const { locale, t } = useI18n();

const sections = computed(() => getMarkdownGuideSections(locale.value ?? "en"));
</script>

<template>
  <section class="markdown-guide">
    <header v-if="showHeader" class="markdown-guide__header">
      <h2 class="markdown-guide__title">{{ t("syntax.title") }}</h2>
      <p class="markdown-guide__intro text-secondary">
        {{ t("syntax.intro") }}
      </p>
    </header>

    <div class="markdown-guide__sections">
      <section
        v-for="section in sections"
        :key="section.title"
        class="markdown-guide__section"
      >
        <h3 class="markdown-guide__section-title">{{ section.title }}</h3>

        <ul class="markdown-guide__list">
          <li v-for="item in section.items" :key="item.title" class="markdown-guide__item">
            <h4 class="markdown-guide__item-title">{{ item.title }}</h4>
            <p class="markdown-guide__item-desc text-secondary">{{ item.description }}</p>
            <pre class="markdown-guide__code"><code>{{ item.syntax }}</code></pre>
          </li>
        </ul>
      </section>
    </div>
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

.markdown-guide__sections {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.markdown-guide__section-title {
  margin: 0 0 12px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #5c5c6f);
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
