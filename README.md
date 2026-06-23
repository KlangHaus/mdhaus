# MdHaus

Open-source macOS markdown editor with a split-pane live preview. Built with **Tauri**, **Rust**, **Vue 3**, and the [Grundtone](https://grundtone.com) design system.

## Features

- Side-by-side editor and live preview
- Resizable split pane
- Native macOS menus (Open, Save, Save As)
- Rust file I/O via Tauri commands
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

The packaged app is written to `src-tauri/target/release/bundle/`.

## Project structure

```
mdhaus/
├── src/                 # Vue frontend
│   ├── components/      # Editor, preview, split pane, shell
│   ├── composables/     # Document state and Tauri integration
│   └── lib/             # Markdown renderer (marked + Grundtone classes)
└── src-tauri/           # Rust backend (file read/write, native menu)
```

## License

MIT — see [LICENSE](./LICENSE).
