export interface FileTreeNode {
  name: string;
  path: string;
  kind: "dir" | "file";
  children: FileTreeNode[];
}

export interface MarkdownDocument {
  path: string;
  content: string;
}
