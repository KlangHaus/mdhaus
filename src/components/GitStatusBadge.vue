<script setup lang="ts">
import { computed } from "vue";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { WorkspaceGitInfo } from "../types/git";
import { useI18n } from "../i18n/useI18n";

const props = defineProps<{
  info: WorkspaceGitInfo | null;
}>();

const { t } = useI18n();

const label = computed(() => {
  if (!props.info) {
    return "";
  }

  const repoLabel = props.info.githubRepo ?? props.info.remoteName;
  const parts = [props.info.branch, repoLabel];

  if (props.info.workspaceRelativePath) {
    parts.push(props.info.workspaceRelativePath);
  }

  return parts.join(" · ");
});

const title = computed(() => {
  if (!props.info) {
    return "";
  }

  const lines = [
    t("git.branch", { branch: props.info.branch }),
    t("git.remote", { remote: props.info.remoteUrl }),
    props.info.repositoryRoot,
  ];

  if (props.info.githubUrl) {
    lines.push(t("git.openOnGitHub"));
  }

  return lines.join("\n");
});

async function onClick() {
  if (!props.info?.githubUrl) {
    return;
  }

  await openUrl(props.info.githubUrl);
}
</script>

<template>
  <a
    v-if="info && info.githubUrl"
    class="git-status git-status--link"
    :href="info.githubUrl"
    :title="title"
    :aria-label="t('git.statusLabel', { label })"
    @click.prevent="onClick"
  >
    <span class="git-status__branch">{{ info.branch }}</span>
    <span class="git-status__separator">·</span>
    <span class="git-status__repo">{{ info.githubRepo ?? info.remoteName }}</span>
    <template v-if="info.workspaceRelativePath">
      <span class="git-status__separator">·</span>
      <span class="git-status__folder">{{ info.workspaceRelativePath }}</span>
    </template>
  </a>
  <span
    v-else-if="info"
    class="git-status"
    :title="title"
    :aria-label="t('git.statusLabel', { label })"
  >
    <span class="git-status__branch">{{ info.branch }}</span>
    <span class="git-status__separator">·</span>
    <span class="git-status__repo">{{ info.githubRepo ?? info.remoteName }}</span>
    <template v-if="info.workspaceRelativePath">
      <span class="git-status__separator">·</span>
      <span class="git-status__folder">{{ info.workspaceRelativePath }}</span>
    </template>
  </span>
</template>

<style scoped lang="scss">
.git-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 16rem;
  padding: 0.2rem 0.45rem;
  border: 1px solid var(--color-border-light, #e4e4ec);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-secondary, #5c5c6f);
  font-size: 0.75rem;
  line-height: 1.2;
  cursor: default;
}

.git-status--link {
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: var(--color-primary, #5b4cdb);
    border-color: color-mix(in srgb, var(--color-primary, #5b4cdb) 35%, var(--color-border-light, #e4e4ec));
  }
}

.git-status__branch,
.git-status__repo,
.git-status__folder {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.git-status__branch {
  font-weight: 700;
  color: var(--color-text, #111118);
}

.git-status__separator {
  flex-shrink: 0;
  opacity: 0.65;
}
</style>
