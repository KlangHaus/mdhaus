export interface ExternalChange {
  path: string;
  content: string;
}

export interface WorkspaceFileChanged {
  path: string;
  content: string;
}

export interface WorkspaceTreeChanged {
  root: string;
}
