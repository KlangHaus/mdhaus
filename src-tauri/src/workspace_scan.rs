use ignore::{DirEntry, WalkBuilder};
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use crate::FileTreeNode;

pub fn is_markdown_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("md") | Some("markdown") | Some("mdx") | Some("txt")
    )
}

pub fn should_skip_dir(name: &str) -> bool {
    matches!(
        name,
        ".git" | ".idea" | ".vscode" | ".turbo" | ".pnpm-store" | "node_modules" | "target" | "dist" | "src-tauri"
    )
}

struct WorkspaceScan {
    root: PathBuf,
    directories: BTreeSet<PathBuf>,
    files: Vec<PathBuf>,
}

fn walk_workspace(root: &Path) -> Result<WorkspaceScan, String> {
    if !root.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let root = root
        .canonicalize()
        .map_err(|error| error.to_string())?;

    let mut directories = BTreeSet::new();
    directories.insert(root.clone());
    let mut files = Vec::new();

    let walker = WalkBuilder::new(&root)
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .hidden(false)
        .filter_entry(|entry| filter_workspace_entry(entry))
        .build();

    for entry in walker {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.into_path();

        if path == root {
            continue;
        }

        if path.is_dir() {
            directories.insert(path);
            continue;
        }

        if !is_markdown_file(&path) {
            continue;
        }

        files.push(path.clone());
        let mut parent = path.parent();
        while let Some(directory) = parent {
            if directory == root || !directory.starts_with(&root) {
                break;
            }

            directories.insert(directory.to_path_buf());
            parent = directory.parent();
        }
    }

    Ok(WorkspaceScan {
        root,
        directories,
        files,
    })
}

fn filter_workspace_entry(entry: &DirEntry) -> bool {
    if entry.depth() == 0 {
        return true;
    }

    let file_type = match entry.file_type() {
        Some(file_type) => file_type,
        None => return true,
    };

    if !file_type.is_dir() {
        return true;
    }

    let name = entry.file_name().to_string_lossy();
    !should_skip_dir(&name)
}

fn build_tree_at(directory: &Path, scan: &WorkspaceScan) -> Vec<FileTreeNode> {
    let mut nodes = Vec::new();

    for path in scan
        .directories
        .iter()
        .filter(|candidate| candidate.parent() == Some(directory) && **candidate != scan.root)
    {
        let name = path
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_default();

        nodes.push(FileTreeNode {
            name,
            path: path.to_string_lossy().to_string(),
            kind: "dir".to_string(),
            children: build_tree_at(path, scan),
        });
    }

    for path in scan.files.iter().filter(|candidate| candidate.parent() == Some(directory)) {
        let name = path
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_default();

        nodes.push(FileTreeNode {
            name,
            path: path.to_string_lossy().to_string(),
            kind: "file".to_string(),
            children: Vec::new(),
        });
    }

    nodes.sort_by(|left, right| left.name.cmp(&right.name));
    nodes
}

pub fn build_markdown_tree(root: &Path) -> Result<Vec<FileTreeNode>, String> {
    let scan = walk_workspace(root)?;
    Ok(build_tree_at(&scan.root, &scan))
}

pub fn collect_markdown_file_paths(root: &Path) -> Result<Vec<PathBuf>, String> {
    let scan = walk_workspace(root)?;
    Ok(scan.files)
}
