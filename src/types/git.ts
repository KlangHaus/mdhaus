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
