export interface WorkspaceGitInfo {
  repositoryRoot: string;
  workspacePath: string;
  workspaceRelativePath: string | null;
  branch: string;
  remoteName: string;
  remoteUrl: string;
  githubRepo: string | null;
  githubUrl: string | null;
}

export interface FileGitAuthor {
  name: string;
  email: string;
  committedRelative: string;
  committedAt: string;
}

export interface GitCommitResult {
  summary: string;
  files: string[];
}

export interface GitContributor {
  name: string;
  commitCount: number;
}
