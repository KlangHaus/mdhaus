use std::fs;
use std::path::{Path, PathBuf};

use crate::git_info::repository_root_for_path;

/// Copy the current on-disk file to `.open-mdhaus-backup/` before it is overwritten.
pub fn backup_markdown_file(file_path: &str) -> Result<(), String> {
    let file = PathBuf::from(file_path);
    if !file.is_file() {
        return Ok(());
    }

    let content = fs::read_to_string(&file).map_err(|error| error.to_string())?;
    let file_canonical = file.canonicalize().map_err(|error| error.to_string())?;
    let base = match repository_root_for_path(&file_canonical)? {
        Some(root) => root,
        None => file_canonical
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| "Cannot resolve backup directory.".to_string())?,
    };

    let relative = match file_canonical.strip_prefix(&base) {
        Ok(value) => value.to_path_buf(),
        Err(_) => file_canonical
            .file_name()
            .map(PathBuf::from)
            .ok_or_else(|| "Cannot resolve backup file name.".to_string())?,
    };

    let destination = base.join(".open-mdhaus-backup").join(relative);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&destination, content).map_err(|error| error.to_string())?;
    Ok(())
}
