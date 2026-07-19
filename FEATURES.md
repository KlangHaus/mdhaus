# open mdHaus — Feature checklist

Track planned and completed features. Mark done items with `[x]`.

## Core editor

- [x] Split-pane markdown editor and live preview
- [x] Resizable split pane
- [x] CodeMirror 6 markdown editing
- [x] GFM task lists in preview
- [x] GFM tables in preview
- [x] Scroll-sync between editor and preview
- [x] Click heading in preview to jump to editor line
- [x] Distraction-free fullscreen writing mode
- [x] Image drag-and-drop into markdown

## Files and workspace

- [x] Open file dialog
- [x] Open folder dialog
- [x] File tree sidebar (markdown only)
- [x] Unsaved indicator per file in tree
- [x] In-memory cache when switching files
- [x] Create new file (`untitled.md`) in workspace
- [x] New file templates (blank, note, meeting, blog)
- [x] Filter/search files in sidebar (name + content)
- [x] Create new folder from UI
- [x] Rename file from UI
- [x] Delete file from UI (with confirmation)
- [x] Collapsible files sidebar and preview contents (TOC) sidebar
- [x] Recent folders list
- [x] Recent files list
- [x] Pinned / favourite files
- [x] Search file **contents** across workspace

## Live disk sync

- [x] Filesystem watch on open folder
- [x] Auto-reload when file changes externally (clean buffer)
- [x] Conflict dialog when file changes externally (dirty buffer)
- [x] Ignore self-save events in watcher
- [x] Refresh file tree on create/delete

## Navigation and shortcuts

- [x] Native macOS menus (File, Edit, Navigate, View, Help)
- [x] Keyboard shortcuts (open, save, next/prev file, syntax, find, shortcuts)
- [x] Shortcuts reference modal
- [x] Next/previous file in folder (`⌥⌘↑` / `⌥⌘↓`)
- [x] Auto-scroll active file in tree
- [ ] Customisable keyboard shortcuts

## Preview and writing aids

- [x] Syntax guide sidebar
- [x] Table of contents in preview (ATX headings, YAML title, and `---` sections)
- [x] Word count and reading time in toolbar
- [x] Focus mode (editor only)
- [x] Pane layout switcher (split / editor / preview)
- [x] Read-only preview mode
- [x] Mermaid / diagram support
- [x] KaTeX math rendering in preview
- [x] YAML front matter editor (title, tags, date)
- [x] Auto-generated document TOC export

## Internationalisation

- [x] Multi-language UI (da, sv, nb, en, de, es)
- [x] Language switcher (Grundtone `GTOverflowMenu`)
- [x] Persist language preference
- [x] Localised markdown syntax examples in guide
- [ ] RTL language support (future)

## Theme and appearance

- [x] Grundtone `GrundtoneThemeProvider` (light/dark/auto)
- [x] In-app theme mode toggle (light / dark / system) via `GTOverflowMenu` + `useTheme`
- [x] Editor font size preference

## Export and interoperability

- [x] Export current file to HTML
- [x] Print current document (preview layout via `.prose`, ⌘P)
- [x] Export current file to PDF
- [x] Wikilink `[[note]]` compatibility (Obsidian-style)
- [x] Respect `.gitignore` when scanning folders

## Git integration

- [x] Git changed-file indicator in tree
- [x] Simple diff view (disk vs last saved)
- [x] Git diff vs HEAD in diff modal
- [x] Branch name in status bar (optional)
- [x] Last author and contributors (read-only git log)
- [x] Commit current file to git
- [x] Git push and pull from UI

## Platform and distribution

- [x] Tauri 2 macOS desktop app
- [x] Rust file I/O commands
- [ ] macOS `.app` code signing for distribution
- [ ] Auto-update channel
- ~~[ ] CLI launcher (`mdhaus path/to/file`)~~ — removed (not needed)

## Documentation and onboarding

- [x] In-app instructions modal
- [x] README for developers
- [ ] User guide on website / docs site

## Quality and reliability

- [ ] Unit tests for markdown renderer
- [ ] E2E smoke test (open folder, edit, save)
- [ ] Crash reporting (optional, opt-in)
- [x] Optional auto-backup to `.open-mdhaus-backup/`

## Nice-to-have / later

- [ ] Split editor (two files side by side)
- [x] Tabs for open files
- [x] Spell check (system or Hunspell)
- [x] Find and replace in editor (⌘F)
- [x] Persist spellcheck preference
- [x] Linked mentions / backlinks panel
- [x] Tag panel with file filtering
- [ ] Plugin system for custom renderers
