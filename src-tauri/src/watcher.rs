use notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, FileIdMap};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

pub struct WatcherState {
    debouncer: Option<Debouncer<notify::RecommendedWatcher, FileIdMap>>,
    ignored_writes: Mutex<HashMap<PathBuf, Instant>>,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            debouncer: None,
            ignored_writes: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Clone, serde::Serialize)]
pub struct WorkspaceFileChanged {
    pub path: String,
    pub content: String,
}

#[derive(Clone, serde::Serialize)]
pub struct WorkspaceTreeChanged {
    pub root: String,
}

fn canonical_key(path: &Path) -> PathBuf {
    path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
}

fn should_skip_watch_path(path: &Path) -> bool {
    path.components().any(|component| {
        let name = component.as_os_str().to_string_lossy();
        matches!(
            name.as_ref(),
            ".git" | ".idea" | ".vscode" | "node_modules" | "target" | "dist" | "src-tauri"
        )
    })
}

fn is_markdown_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("md") | Some("markdown") | Some("mdx") | Some("txt")
    )
}

fn is_ignored_write(state: &WatcherState, path: &Path) -> bool {
    let key = canonical_key(path);
    let mut ignored = state.ignored_writes.lock().expect("ignored_writes lock");
    ignored.retain(|_, instant| instant.elapsed() < Duration::from_secs(2));

    if let Some(instant) = ignored.get(&key) {
        return instant.elapsed() < Duration::from_millis(800);
    }

    false
}

/// Ignore filesystem events for a path after the app writes to disk.
#[tauri::command]
pub fn notify_file_saved(path: String, state: State<'_, Mutex<WatcherState>>) -> Result<(), String> {
    let key = canonical_key(Path::new(&path));
    let watcher = state.lock().map_err(|error| error.to_string())?;
    watcher
        .ignored_writes
        .lock()
        .map_err(|error| error.to_string())?
        .insert(key, Instant::now());
    Ok(())
}

/// Watch a workspace folder and emit change events to the frontend.
#[tauri::command]
pub fn start_workspace_watch(
    root: String,
    app: AppHandle,
    state: State<'_, Mutex<WatcherState>>,
) -> Result<(), String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err("Watch path is not a directory.".to_string());
    }

    let root_string = root_path
        .canonicalize()
        .map_err(|error| error.to_string())?
        .to_string_lossy()
        .to_string();

    let mut watcher_state = state.lock().map_err(|error| error.to_string())?;
    watcher_state.debouncer = None;

    let app_handle = app.clone();

    let debouncer = new_debouncer(
        Duration::from_millis(300),
        None,
        move |result: DebounceEventResult| {
            let Ok(events) = result else {
                return;
            };

            let Some(state_mutex) = app_handle.try_state::<Mutex<WatcherState>>() else {
                return;
            };

            let Ok(state) = state_mutex.lock() else {
                return;
            };

            let mut tree_changed = false;
            let watch_root = root_string.clone();

            for event in events {
                for path in &event.paths {
                    if should_skip_watch_path(path) {
                        continue;
                    }

                    if is_ignored_write(&state, path) {
                        continue;
                    }

                    if path.is_dir() {
                        tree_changed = true;
                        continue;
                    }

                    if !is_markdown_file(path) {
                        continue;
                    }

                    match event.kind {
                        notify::EventKind::Modify(_) => {
                            if let Ok(content) = std::fs::read_to_string(path) {
                                let _ = app_handle.emit(
                                    "workspace-file-changed",
                                    WorkspaceFileChanged {
                                        path: path.to_string_lossy().to_string(),
                                        content,
                                    },
                                );
                            }
                        }
                        notify::EventKind::Create(_) | notify::EventKind::Remove(_) => {
                            tree_changed = true;
                        }
                        _ => {}
                    }
                }
            }

            if tree_changed {
                let _ = app_handle.emit(
                    "workspace-tree-changed",
                    WorkspaceTreeChanged {
                        root: watch_root,
                    },
                );
            }
        },
    )
    .map_err(|error| error.to_string())?;

    let mut debouncer = debouncer;
    debouncer
        .watch(&root_path, RecursiveMode::Recursive)
        .map_err(|error| error.to_string())?;

    watcher_state.debouncer = Some(debouncer);
    Ok(())
}

#[tauri::command]
pub fn stop_workspace_watch(state: State<'_, Mutex<WatcherState>>) -> Result<(), String> {
    let mut watcher_state = state.lock().map_err(|error| error.to_string())?;
    watcher_state.debouncer = None;
    Ok(())
}
