export const GIT_COMMIT_DOCS_PREFIX = "docs: ";

/** Default conventional-commit message for workspace commits. */
export function buildDefaultCommitMessage(scopeName: string, fileCount = 1): string {
  if (fileCount === 1) {
    const baseName = scopeName.replace(/\.(md|markdown|mdx|txt)$/i, "");
    return `${GIT_COMMIT_DOCS_PREFIX}update ${baseName}`;
  }

  const folderName = scopeName.replace(/\/$/, "").split("/").pop() ?? scopeName;
  return `${GIT_COMMIT_DOCS_PREFIX}update ${folderName}`;
}

/** Ensure docs commits always use the docs: prefix unless the user chose another type. */
export function normalizeDocsCommitMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  if (/^[a-z]+:\s*/i.test(trimmed)) {
    return trimmed;
  }

  return `${GIT_COMMIT_DOCS_PREFIX}${trimmed}`;
}
