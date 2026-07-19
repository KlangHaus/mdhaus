use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileGitAuthor {
    pub name: String,
    pub email: String,
    pub committed_relative: String,
    pub committed_at: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitContributor {
    pub name: String,
    pub commit_count: u32,
}

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

pub fn repository_root_for_path(path: &Path) -> Result<Option<PathBuf>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let lookup_path = if path.is_dir() { path } else { path.parent().unwrap_or(path) };

    match run_git(lookup_path, &["rev-parse", "--show-toplevel"]) {
        Ok(value) => Ok(Some(PathBuf::from(value))),
        Err(_) => Ok(None),
    }
}

fn parse_file_git_author(output: &str) -> Result<Option<FileGitAuthor>, String> {
    let line = output.lines().next().unwrap_or("").trim();
    if line.is_empty() {
        return Ok(None);
    }

    let parts: Vec<&str> = line.split('\t').collect();
    if parts.len() != 4 {
        return Err("Unexpected git log format.".to_string());
    }

    Ok(Some(FileGitAuthor {
        name: parts[0].trim().to_string(),
        email: parts[1].trim().to_string(),
        committed_relative: parts[2].trim().to_string(),
        committed_at: parts[3].trim().to_string(),
    }))
}

fn parse_shortlog_line(line: &str) -> Option<GitContributor> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    let (count_part, name) = if let Some(tab_index) = trimmed.find('\t') {
        (trimmed[..tab_index].trim(), trimmed[tab_index + 1..].trim())
    } else {
        let mut pieces = trimmed.splitn(2, ' ');
        let count = pieces.next()?.trim();
        let author = pieces.next()?.trim();
        (count, author)
    };

    if name.is_empty() {
        return None;
    }

    let commit_count = count_part.parse::<u32>().ok()?;
    Some(GitContributor {
        name: name.to_string(),
        commit_count,
    })
}

pub fn get_file_last_author(file_path: &str) -> Result<Option<FileGitAuthor>, String> {
    let file = PathBuf::from(file_path);
    if !file.is_file() {
        return Ok(None);
    }

    let Some(repository_root) = repository_root_for_path(&file)? else {
        return Ok(None);
    };

    let file_canonical = canonicalize_path(&file)?;
    let repo_canonical = canonicalize_path(&repository_root)?;
    let relative = match file_canonical.strip_prefix(&repo_canonical) {
        Ok(value) => value.to_string_lossy().to_string(),
        Err(_) => return Ok(None),
    };

    let output = match run_git(
        &repo_canonical,
        &[
            "log",
            "-1",
            "--follow",
            "--format=%an\t%ae\t%ar\t%ci",
            "--",
            &relative,
        ],
    ) {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };

    parse_file_git_author(&output)
}

pub fn get_repository_contributors(workspace_path: &str) -> Result<Vec<GitContributor>, String> {
    let workspace = PathBuf::from(workspace_path);
    if !workspace.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let Some(repository_root) = repository_root_for_path(&workspace)? else {
        return Ok(Vec::new());
    };

    let repo_canonical = canonicalize_path(&repository_root)?;
    let output = run_git(&repo_canonical, &["shortlog", "-sn", "--all"])?;

    let mut contributors: Vec<GitContributor> = output
        .lines()
        .filter_map(parse_shortlog_line)
        .collect();

    contributors.sort_by(|left, right| {
        right
            .commit_count
            .cmp(&left.commit_count)
            .then_with(|| left.name.cmp(&right.name))
    });

    Ok(contributors)
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitResult {
    pub summary: String,
    pub files: Vec<String>,
}

pub fn git_commit_workspace(
    workspace_path: &str,
    message: &str,
    files: &[String],
) -> Result<GitCommitResult, String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Commit message cannot be empty.".to_string());
    }

    if files.is_empty() {
        return Err("No files selected.".to_string());
    }

    let workspace = PathBuf::from(workspace_path);
    if !workspace.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let Some(repository_root) = repository_root_for_path(&workspace)? else {
        return Err("Not a git repository.".to_string());
    };

    let workspace_canonical = canonicalize_path(&workspace)?;
    let repo_canonical = canonicalize_path(&repository_root)?;

    for relative in files {
        let absolute = if relative == "." {
            workspace_canonical.clone()
        } else {
            workspace_canonical.join(relative)
        };

        let repo_relative = absolute
            .strip_prefix(&repo_canonical)
            .map_err(|_| format!("File is outside git repository: {relative}"))?
            .to_string_lossy()
            .to_string();

        run_git(&repo_canonical, &["add", "--", &repo_relative])?;
    }

    run_git(&repo_canonical, &["commit", "-m", trimmed])?;

    let summary = run_git(&repo_canonical, &["log", "-1", "--format=%h %s"])?;

    Ok(GitCommitResult {
        summary,
        files: files.to_vec(),
    })
}

pub fn git_commit_file(file_path: &str, message: &str) -> Result<String, String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Commit message cannot be empty.".to_string());
    }

    let file = PathBuf::from(file_path);
    if !file.is_file() {
        return Err("File does not exist.".to_string());
    }

    let Some(repository_root) = repository_root_for_path(&file)? else {
        return Err("Not a git repository.".to_string());
    };

    let file_canonical = canonicalize_path(&file)?;
    let repo_canonical = canonicalize_path(&repository_root)?;
    let relative = match file_canonical.strip_prefix(&repo_canonical) {
        Ok(value) => value.to_string_lossy().to_string(),
        Err(_) => return Err("File is outside git repository.".to_string()),
    };

    run_git(&repo_canonical, &["add", "--", &relative])?;
    run_git(
        &repo_canonical,
        &["commit", "-m", trimmed, "--", &relative],
    )?;

    let summary = run_git(
        &repo_canonical,
        &["log", "-1", "--format=%h %s", "--", &relative],
    )?;

    Ok(summary)
}

struct WorkspaceGitRemote {
    repository: PathBuf,
    remote_name: String,
    branch: String,
}

fn workspace_git_remote(workspace_path: &str) -> Result<Option<WorkspaceGitRemote>, String> {
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
            match first_remote(&workspace_canonical) {
                Ok(name) => name,
                Err(_) => return Ok(None),
            }
        }
    };

    Ok(Some(WorkspaceGitRemote {
        repository: repository_canonical,
        remote_name,
        branch,
    }))
}

pub fn git_push_workspace(workspace_path: &str) -> Result<String, String> {
    let Some(ctx) = workspace_git_remote(workspace_path)? else {
        return Err("Not a git repository with a remote.".to_string());
    };

    run_git(
        &ctx.repository,
        &["push", &ctx.remote_name, &ctx.branch],
    )?;

    Ok(format!("Pushed to {}/{}", ctx.remote_name, ctx.branch))
}

pub fn git_pull_workspace(workspace_path: &str) -> Result<String, String> {
    let Some(ctx) = workspace_git_remote(workspace_path)? else {
        return Err("Not a git repository with a remote.".to_string());
    };

    run_git(
        &ctx.repository,
        &["pull", "--ff-only", &ctx.remote_name, &ctx.branch],
    )?;

    Ok(format!("Pulled from {}/{}", ctx.remote_name, ctx.branch))
}

pub fn get_file_content_at_head(file_path: &str) -> Result<Option<String>, String> {
    let file = PathBuf::from(file_path);
    if !file.is_file() {
        return Ok(None);
    }

    let Some(repository_root) = repository_root_for_path(&file)? else {
        return Ok(None);
    };

    let file_canonical = canonicalize_path(&file)?;
    let repo_canonical = canonicalize_path(&repository_root)?;
    let relative = match file_canonical.strip_prefix(&repo_canonical) {
        Ok(value) => value.to_string_lossy().to_string(),
        Err(_) => return Ok(None),
    };

    let spec = format!("HEAD:{relative}");
    match run_git(&repo_canonical, &["show", &spec]) {
        Ok(content) => Ok(Some(content)),
        Err(_) => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_file_git_author, parse_github_repo, parse_shortlog_line};

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

    #[test]
    fn parses_git_log_author_line() {
        let parsed = parse_file_git_author("Allan\ta@example.com\t2 days ago\t2026-06-23 10:00:00 +0200")
            .unwrap()
            .unwrap();
        assert_eq!(parsed.name, "Allan");
        assert_eq!(parsed.email, "a@example.com");
        assert_eq!(parsed.committed_relative, "2 days ago");
    }

    #[test]
    fn parses_shortlog_line_with_tab() {
        let parsed = parse_shortlog_line("    12\tAllan Asp").unwrap();
        assert_eq!(parsed.commit_count, 12);
        assert_eq!(parsed.name, "Allan Asp");
    }

    #[test]
    fn parses_shortlog_line_with_spaces() {
        let parsed = parse_shortlog_line("     3 Jane Doe").unwrap();
        assert_eq!(parsed.commit_count, 3);
        assert_eq!(parsed.name, "Jane Doe");
    }
}
