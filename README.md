# open mdHaus

Open-source macOS markdown editor with a split-pane live preview. Built with **Tauri**, **Rust**, **Vue 3**, and the [Grundtone](https://grundtone.com) design system.

## Features

- Side-by-side editor and live preview
- Resizable split pane
- File tree sidebar for quick navigation between markdown files
- Keyboard shortcuts for files, navigation, and panels
- **Live disk sync** — external changes reload automatically (with conflict prompt when unsaved)
- **Multi-language UI** — Danish, Swedish, Norwegian, English, German, Spanish
- Native macOS menus
- Rust file I/O and filesystem watching via Tauri
- Grundtone UI components and prose styling

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (install via Homebrew: `brew install rust`)
- macOS (primary target)

## Development

```bash
cd mdhaus
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

The packaged app is written to `src-tauri/target/release/bundle/` as **open mdHaus.app**.

## Project structure

```
mdhaus/
├── src/                 # Vue frontend
│   ├── components/      # Editor, preview, modals, shell
│   ├── composables/     # Workspace, shortcuts, Tauri integration
│   ├── lib/             # Markdown renderer, helpers
│   └── i18n/            # Locales (da, sv, nb, en, de, es)
└── src-tauri/           # Rust backend (I/O, watch, menu)
```

## License

MIT — see [LICENSE](./LICENSE).
