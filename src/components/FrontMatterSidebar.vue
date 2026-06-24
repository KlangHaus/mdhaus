<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { GTButton, GTIcon } from "@grundtone/vue";
import {
  applyFrontMatterFields,
  emptyFrontMatterFields,
  parseFrontMatterDocument,
  type FrontMatterFields,
} from "../lib/frontMatter";
import { useI18n } from "../i18n/useI18n";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  source: string;
}>();

const emit = defineEmits<{
  apply: [value: string];
}>();

const { t } = useI18n();

const fields = ref<FrontMatterFields>(emptyFrontMatterFields());
const hasFrontMatter = ref(false);
let applyTimer: ReturnType<typeof setTimeout> | undefined;

const toggleLabel = computed(() =>
  open.value ? t("frontMatter.toggleHide") : t("frontMatter.toggleShow"),
);
const toggleIcon = computed(() => (open.value ? "chevron-left" : "chevron-right"));

function syncFromSource(source: string) {
  const parsed = parseFrontMatterDocument(source);
  hasFrontMatter.value = parsed.hasFrontMatter;
  fields.value = { ...parsed.fields };
}

function scheduleApply() {
  clearTimeout(applyTimer);
  applyTimer = setTimeout(() => {
    const next = applyFrontMatterFields(props.source, fields.value);
    if (next !== props.source) {
      emit("apply", next);
    }
  }, 250);
}

function insertFrontMatter() {
  if (hasFrontMatter.value) {
    return;
  }

  fields.value = {
    ...emptyFrontMatterFields(),
    date: new Date().toISOString().slice(0, 10),
  };
  scheduleApply();
}

function toggle() {
  open.value = !open.value;
}

watch(
  () => props.source,
  (source) => {
    syncFromSource(source);
  },
  { immediate: true },
);

onUnmounted(() => {
  clearTimeout(applyTimer);
});
</script>

<template>
  <aside
    id="front-matter-sidebar-panel"
    class="front-matter-aside cq-sidebar border-r bg-surface-raised flex flex-col min-h-0"
    :class="open ? 'sidebar-expanded front-matter-aside--open' : 'sidebar-collapsed front-matter-aside--closed'"
    :aria-expanded="open"
  >
    <header class="front-matter-aside__header flex items-center gap-2 p-3 border-b">
      <GTButton
        size="sm"
        variant="unstyled"
        class="front-matter-aside__toggle"
        :aria-label="toggleLabel"
        @click="toggle"
      >
        <GTIcon :name="toggleIcon" size="sm" class="sidebar-icon" />
        <span class="sidebar-text text-sm font-semibold">{{ t("frontMatter.label") }}</span>
      </GTButton>

      <h2 v-if="open" class="front-matter-aside__title sidebar-text text-sm font-bold m-0 flex-1">
        {{ t("frontMatter.title") }}
      </h2>

      <GTButton
        v-if="open"
        size="sm"
        variant="unstyled"
        :aria-label="t('frontMatter.close')"
        @click="open = false"
      >
        <GTIcon name="chevron-left" size="sm" />
      </GTButton>
    </header>

    <div v-show="open" class="front-matter-aside__body flex-1 min-h-0 overflow-auto p-3">
      <p v-if="!hasFrontMatter" class="front-matter-aside__hint text-secondary text-sm m-0">
        {{ t("frontMatter.emptyHint") }}
      </p>

      <form class="front-matter-aside__form" @submit.prevent>
        <label class="front-matter-aside__field">
          <span class="front-matter-aside__label">{{ t("frontMatter.titleLabel") }}</span>
          <input
            v-model="fields.title"
            type="text"
            class="front-matter-aside__input"
            autocomplete="off"
            @input="scheduleApply"
          />
        </label>

        <label class="front-matter-aside__field">
          <span class="front-matter-aside__label">{{ t("frontMatter.dateLabel") }}</span>
          <input
            v-model="fields.date"
            type="date"
            class="front-matter-aside__input"
            @input="scheduleApply"
          />
        </label>

        <label class="front-matter-aside__field">
          <span class="front-matter-aside__label">{{ t("frontMatter.authorLabel") }}</span>
          <input
            v-model="fields.author"
            type="text"
            class="front-matter-aside__input"
            autocomplete="off"
            @input="scheduleApply"
          />
        </label>

        <label class="front-matter-aside__field">
          <span class="front-matter-aside__label">{{ t("frontMatter.tagsLabel") }}</span>
          <input
            v-model="fields.tags"
            type="text"
            class="front-matter-aside__input"
            autocomplete="off"
            :placeholder="t('frontMatter.tagsHint')"
            @input="scheduleApply"
          />
        </label>
      </form>

      <GTButton
        v-if="!hasFrontMatter"
        size="sm"
        variant="outlined"
        class="front-matter-aside__insert"
        @click="insertFrontMatter"
      >
        {{ t("frontMatter.insert") }}
      </GTButton>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.front-matter-aside {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 20;
  width: 3rem;
  transition: width 220ms ease;
  overflow: hidden;
  flex-shrink: 0;
  border-color: var(--color-border-light, #e4e4ec);
}

.front-matter-aside--open {
  width: 18rem;
}

.front-matter-aside__header {
  border-color: var(--color-border-light, #e4e4ec);
  min-height: 3rem;
}

.front-matter-aside--closed .front-matter-aside__header {
  justify-content: center;
  padding-inline: 0.5rem;
}

.front-matter-aside__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.front-matter-aside--closed .front-matter-aside__toggle {
  justify-content: center;
  width: 100%;
}

.front-matter-aside__title {
  color: var(--color-text, #111118);
}

.front-matter-aside__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.front-matter-aside__hint {
  line-height: 1.45;
}

.front-matter-aside__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.front-matter-aside__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.front-matter-aside__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #5c5c6f);
}

.front-matter-aside__input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #111118);
  font-size: 0.8125rem;

  &:focus {
    outline: 2px solid color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, transparent);
    outline-offset: 1px;
  }
}

.front-matter-aside__insert {
  align-self: flex-start;
}
</style>
