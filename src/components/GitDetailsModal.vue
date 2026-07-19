<script setup lang="ts">
import { GTButton } from "@grundtone/vue";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { FileGitAuthor, GitContributor, WorkspaceGitInfo } from "../types/git";
import { useI18n } from "../i18n/useI18n";

defineProps<{
  open: boolean;
  info: WorkspaceGitInfo | null;
  fileAuthor: FileGitAuthor | null;
  contributors: GitContributor[];
  syncing: "push" | "pull" | null;
}>();

const emit = defineEmits<{
  close: [];
  push: [];
  pull: [];
}>();

const { t } = useI18n();

async function openGitHub(url: string) {
  await openUrl(url);
}
</script>

<template>
  <div v-if="open && info" class="git-details-modal" role="dialog" aria-modal="true" :aria-label="t('git.detailsTitle')">
    <button type="button" class="git-details-modal__backdrop" :aria-label="t('modals.close')" @click="emit('close')" />

    <section class="git-details-modal__panel bg-surface-raised border rounded-md">
      <header class="git-details-modal__header p-4 border-b">
        <h2 class="text-base font-bold m-0">{{ t("git.detailsTitle") }}</h2>
        <p class="text-secondary text-sm m-0 mt-1">{{ info.branch }} · {{ info.githubRepo ?? info.remoteName }}</p>
      </header>

      <div class="git-details-modal__body p-4">
        <section class="git-details-modal__section">
          <h3 class="git-details-modal__section-title">{{ t("git.lastAuthorTitle") }}</h3>
          <p v-if="fileAuthor" class="git-details-modal__text m-0">
            {{ t("git.lastAuthorDetail", { name: fileAuthor.name, when: fileAuthor.committedRelative }) }}
          </p>
          <p v-else class="git-details-modal__text text-secondary m-0">{{ t("git.lastAuthorUnknown") }}</p>
        </section>

        <section class="git-details-modal__section">
          <h3 class="git-details-modal__section-title">{{ t("git.contributorsTitle") }}</h3>
          <p v-if="contributors.length === 0" class="git-details-modal__text text-secondary m-0">
            {{ t("git.contributorsEmpty") }}
          </p>
          <ul v-else class="git-details-modal__contributors">
            <li v-for="contributor in contributors" :key="contributor.name" class="git-details-modal__contributor">
              <span class="git-details-modal__contributor-name">{{ contributor.name }}</span>
              <span class="git-details-modal__contributor-count text-secondary">
                {{ t("git.commits", { count: contributor.commitCount }) }}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <footer class="git-details-modal__footer flex justify-end gap-2 p-4 border-t">
        <GTButton
          size="sm"
          variant="outlined"
          type="button"
          :disabled="syncing !== null"
          @click="emit('pull')"
        >
          {{ syncing === "pull" ? t("git.pulling") : t("git.pull") }}
        </GTButton>
        <GTButton
          size="sm"
          variant="outlined"
          type="button"
          :disabled="syncing !== null"
          @click="emit('push')"
        >
          {{ syncing === "push" ? t("git.pushing") : t("git.push") }}
        </GTButton>
        <GTButton
          v-if="info.githubUrl"
          size="sm"
          variant="outlined"
          type="button"
          :disabled="syncing !== null"
          @click="openGitHub(info.githubUrl)"
        >
          {{ t("git.openOnGitHub") }}
        </GTButton>
        <GTButton size="sm" variant="primary" type="button" :disabled="syncing !== null" @click="emit('close')">
          {{ t("modals.close") }}
        </GTButton>
      </footer>
    </section>
  </div>
</template>

<style scoped lang="scss">
.git-details-modal {
  position: fixed;
  inset: 0;
  z-index: 48;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.git-details-modal__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.git-details-modal__panel {
  position: relative;
  width: min(32rem, 100%);
  max-height: min(80vh, 36rem);
  display: flex;
  flex-direction: column;
  border-color: var(--color-border-light, #e4e4ec);
}

.git-details-modal__header,
.git-details-modal__footer {
  border-color: var(--color-border-light, #e4e4ec);
}

.git-details-modal__body {
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.git-details-modal__section-title {
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #5c5c6f);
}

.git-details-modal__text {
  font-size: 0.9rem;
  line-height: 1.5;
}

.git-details-modal__contributors {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.git-details-modal__contributor {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--color-border-light, #e4e4ec);

  &:last-child {
    border-bottom: none;
  }
}

.git-details-modal__contributor-name {
  font-size: 0.88rem;
  font-weight: 600;
}

.git-details-modal__contributor-count {
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>
