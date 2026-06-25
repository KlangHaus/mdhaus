use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceGitInfo {
    pub repository_root: String,
    pub workspace_path: String,
    pub workspace_relative_path: Option<String>,
    pub branch: String,
    pub remote_name: String,
    pub remote_url: String,
    pub github_repo: Option<String>,
    pub github_url: Option<String>,
}

fn run_git(workspace: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(workspace)
        .args(args)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn canonicalize_path(path: &Path) -> Result<PathBuf, String> {
    path.canonicalize().map_err(|error| error.to_string())
}

fn relative_workspace_path(repository_root: &Path, workspace_path: &Path) -> Option<String> {
    let relative = workspace_path.strip_prefix(repository_root).ok()?;
    let value = relative.to_string_lossy().trim_matches('/').to_string();
    if value.is_empty() {
        return None;
    }

    Some(value)
}

fn first_remote(workspace: &Path) -> Result<String, String> {
    let remotes = run_git(workspace, &["remote"])?;
    let remote = remotes
        .lines()
        .map(str::trim)
        .find(|name| !name.is_empty())
        .ok_or_else(|| "No git remotes configured.".to_string())?;

    Ok(remote.to_string())
}

pub fn parse_github_repo(remote_url: &str) -> Option<(String, String)> {
    let trimmed = remote_url.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Some(rest) = trimmed.strip_prefix("https://github.com/") {
        return github_repo_from_path(rest);
    }

    if let Some(rest) = trimmed.strip_prefix("http://github.com/") {
        return github_repo_from_path(rest);
    }

    if let Some(rest) = trimmed.strip_prefix("git@github.com:") {
        return github_repo_from_path(rest);
    }

    if let Some(rest) = trimmed.strip_prefix("ssh://git@github.com/") {
        return github_repo_from_path(rest);
    }

    None
}

fn github_repo_from_path(path: &str) -> Option<(String, String)> {
    let normalized = path.trim().trim_end_matches(".git").trim_matches('/');
    if normalized.is_empty() || !normalized.contains('/') {
        return None;
    }

    let repo = normalized.to_string();
    let url = format!("https://github.com/{repo}");
    Some((repo, url))
}

pub fn get_workspace_git_info(workspace_path: &str) -> Result<Option<WorkspaceGitInfo>, String> {
    let workspace = PathBuf::from(workspace_path);
    if !workspace.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let repository_root = match run_git(&workspace, &["rev-parse", "--show-toplevel"]) {
        Ok(value) => PathBuf::from(value),
        Err(_) => return Ok(None),
    };

    let workspace_canonical = canonicalize_path(&workspace)?;
    let repository_canonical = canonicalize_path(&repository_root)?;

    let branch = run_git(&workspace_canonical, &["branch", "--show-current"])?;
    if branch.is_empty() {
        return Ok(None);
    }

    let remote_name = {
        let remotes = run_git(&workspace_canonical, &["remote"])?;
        if remotes.lines().any(|name| name.trim() == "origin") {
            "origin".to_string()
        } else {
            first_remote(&workspace_canonical)?
        }
    };

    let remote_url = run_git(
        &workspace_canonical,
        &["remote", "get-url", &remote_name],
    )?;

    let (github_repo, github_url) = parse_github_repo(&remote_url)
        .map(|(repo, url)| (Some(repo), Some(url)))
        .unwrap_or((None, None));

    Ok(Some(WorkspaceGitInfo {
        repository_root: repository_canonical.to_string_lossy().to_string(),
        workspace_path: workspace_canonical.to_string_lossy().to_string(),
        workspace_relative_path: relative_workspace_path(&repository_canonical, &workspace_canonical),
        branch,
        remote_name,
        remote_url,
        github_repo,
        github_url,
    }))
}

pub fn get_workspace_git_changed_paths(workspace_path: &str) -> Result<Vec<String>, String> {
    let workspace = PathBuf::from(workspace_path);
    if !workspace.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let repository_root = match run_git(&workspace, &["rev-parse", "--show-toplevel"]) {
        Ok(value) => PathBuf::from(value),
        Err(_) => return Ok(Vec::new()),
    };

    let workspace_canonical = canonicalize_path(&workspace)?;
    let repository_canonical = canonicalize_path(&repository_root)?;
    let status = run_git(
        &workspace_canonical,
        &["status", "--porcelain", "--untracked-files=all"],
    )?;

    let mut changed = Vec::new();
    let workspace_prefix = workspace_canonical.to_string_lossy().to_string();

    for line in status.lines() {
        if line.len() < 4 {
            continue;
        }

        let candidate = &line[3..];
        let relative = candidate
            .split(" -> ")
            .last()
            .map(str::trim)
            .unwrap_or_default();
        if relative.is_empty() {
            continue;
        }

        let full_path = repository_canonical.join(relative);
        let full_string = full_path.to_string_lossy().to_string();
        if full_string == workspace_prefix || full_string.starts_with(&format!("{workspace_prefix}/")) {
            changed.push(full_string);
        }
    }

    Ok(changed)
}

#[cfg(test)]
mod tests {
    use super::parse_github_repo;

    #[test]
    fn parses_https_github_remote() {
        let parsed = parse_github_repo("https://github.com/klanghaus/docs.git").unwrap();
        assert_eq!(parsed.0, "klanghaus/docs");
        assert_eq!(parsed.1, "https://github.com/klanghaus/docs");
    }

    #[test]
    fn parses_ssh_github_remote() {
        let parsed = parse_github_repo("git@github.com:klanghaus/docs.git").unwrap();
        assert_eq!(parsed.0, "klanghaus/docs");
    }
}
