mod git_info;
mod watcher;
mod workspace_scan;

use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Emitter, Manager,
};
use git_info::{get_workspace_git_changed_paths, get_workspace_git_info, WorkspaceGitInfo};
use watcher::{notify_file_saved, start_workspace_watch, stop_workspace_watch, WatcherState};
use workspace_scan::{build_markdown_tree, collect_markdown_file_paths};

#[derive(Serialize)]
struct MarkdownDocument {
    path: String,
    content: String,
}

#[derive(Serialize)]
struct FileTreeNode {
    name: String,
    path: String,
    kind: String,
    children: Vec<FileTreeNode>,
}

/// Read a markdown file from disk and return its path and UTF-8 contents.
#[tauri::command]
fn read_markdown_file(path: String) -> Result<MarkdownDocument, String> {
    let content = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;

    Ok(MarkdownDocument { path, content })
}

/// Write markdown content to disk, creating parent directories when needed.
#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<MarkdownDocument, String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    std::fs::write(&path, &content).map_err(|error| error.to_string())?;

    Ok(MarkdownDocument { path, content })
}

/// Search markdown file contents under a workspace root (case-insensitive substring).
#[tauri::command]
fn search_markdown_content(root: String, query: String) -> Result<Vec<String>, String> {
    let needle = query.trim().to_lowercase();
    if needle.len() < 2 {
        return Ok(Vec::new());
    }

    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    let files = collect_markdown_file_paths(&root_path)?;

    let mut matches = Vec::new();
    for path in files {
        let content = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;
        if content.to_lowercase().contains(&needle) {
            matches.push(path.to_string_lossy().to_string());
        }
    }

    Ok(matches)
}

/// Rename a markdown file on disk.
#[tauri::command]
fn rename_markdown_path(from: String, to: String) -> Result<String, String> {
    if from == to {
        return Ok(to);
    }

    if Path::new(&to).exists() {
        return Err("Destination already exists.".to_string());
    }

    if let Some(parent) = Path::new(&to).parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    std::fs::rename(&from, &to).map_err(|error| error.to_string())?;

    Ok(to)
}

/// Create a folder on disk.
#[tauri::command]
fn create_markdown_folder(path: String) -> Result<String, String> {
    let folder = Path::new(&path);
    if folder.exists() {
        return Err("Destination already exists.".to_string());
    }

    std::fs::create_dir_all(&path).map_err(|error| error.to_string())?;

    Ok(path)
}

/// Delete a markdown file from disk.
#[tauri::command]
fn delete_markdown_path(path: String) -> Result<(), String> {
    let meta = std::fs::metadata(&path).map_err(|error| error.to_string())?;
    if meta.is_dir() {
        return Err("Cannot delete directories.".to_string());
    }

    std::fs::remove_file(&path).map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn list_markdown_tree(root: String) -> Result<Vec<FileTreeNode>, String> {
    let path = PathBuf::from(&root);
    if !path.is_dir() {
        return Err("Selected path is not a directory.".to_string());
    }

    build_markdown_tree(&path)
}

/// Read git repository and branch metadata for an open workspace folder.
#[tauri::command]
fn read_workspace_git_info(workspace_path: String) -> Result<Option<WorkspaceGitInfo>, String> {
    get_workspace_git_info(&workspace_path)
}

#[tauri::command]
fn read_workspace_git_changed_paths(workspace_path: String) -> Result<Vec<String>, String> {
    get_workspace_git_changed_paths(&workspace_path)
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let open_item = MenuItem::with_id(app, "open", "Open…", true, Some("CmdOrCtrl+O"))?;
    let open_folder_item =
        MenuItem::with_id(app, "open_folder", "Open Folder…", true, Some("CmdOrCtrl+Shift+O"))?;
    let save_item = MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let save_as_item =
        MenuItem::with_id(app, "save_as", "Save As…", true, Some("CmdOrCtrl+Shift+S"))?;
    let print_item = MenuItem::with_id(app, "print", "Print…", true, Some("CmdOrCtrl+P"))?;
    let export_html_item =
        MenuItem::with_id(app, "export_html", "Export HTML…", true, None::<&str>)?;
    let export_pdf_item =
        MenuItem::with_id(app, "export_pdf", "Export PDF…", true, None::<&str>)?;
    let export_toc_item =
        MenuItem::with_id(app, "export_toc", "Export TOC…", true, None::<&str>)?;

    let prev_file_item =
        MenuItem::with_id(app, "prev_file", "Previous File", true, Some("Alt+CmdOrCtrl+Up"))?;
    let next_file_item =
        MenuItem::with_id(app, "next_file", "Next File", true, Some("Alt+CmdOrCtrl+Down"))?;
    let toggle_syntax_item =
        MenuItem::with_id(app, "toggle_syntax", "Toggle Syntax Guide", true, Some("CmdOrCtrl+\\"))?;
    let instructions_item =
        MenuItem::with_id(app, "instructions", "Instructions…", true, None::<&str>)?;

    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &open_item,
            &open_folder_item,
            &save_item,
            &save_as_item,
            &print_item,
            &export_html_item,
            &export_pdf_item,
            &export_toc_item,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    let navigate_menu = Submenu::with_items(
        app,
        "Navigate",
        true,
        &[&prev_file_item, &next_file_item],
    )?;

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &toggle_syntax_item,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;

    let help_menu = Submenu::with_items(app, "Help", true, &[&instructions_item])?;

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    Menu::with_items(
        app,
        &[
            &Submenu::with_items(
                app,
                "open mdHaus",
                true,
                &[
                    &PredefinedMenuItem::about(app, Some("open mdHaus"), None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::services(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::hide(app, None)?,
                    &PredefinedMenuItem::hide_others(app, None)?,
                    &PredefinedMenuItem::show_all(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?,
            &file_menu,
            &navigate_menu,
            &edit_menu,
            &view_menu,
            &help_menu,
            &window_menu,
        ],
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(WatcherState::new()))
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            write_markdown_file,
            rename_markdown_path,
            create_markdown_folder,
            delete_markdown_path,
            list_markdown_tree,
            search_markdown_content,
            read_workspace_git_info,
            read_workspace_git_changed_paths,
            start_workspace_watch,
            stop_workspace_watch,
            notify_file_saved,
        ])
        .setup(|app| {
            let menu = build_menu(app.handle())?;
            app.set_menu(menu)?;

            app.on_menu_event(|app, event| {
                let window = match app.get_webview_window("main") {
                    Some(window) => window,
                    None => return,
                };

                let event_name = match event.id().as_ref() {
                    "open" => Some("menu-open"),
                    "open_folder" => Some("menu-open-folder"),
                    "prev_file" => Some("menu-prev-file"),
                    "next_file" => Some("menu-next-file"),
                    "toggle_syntax" => Some("menu-toggle-syntax"),
                    "instructions" => Some("menu-instructions"),
                    "save" => Some("menu-save"),
                    "save_as" => Some("menu-save-as"),
                    "print" => Some("menu-print"),
                    "export_html" => Some("menu-export-html"),
                    "export_pdf" => Some("menu-export-pdf"),
                    "export_toc" => Some("menu-export-toc"),
                    _ => None,
                };

                if let Some(name) = event_name {
                    let _ = window.emit(name, ());
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
