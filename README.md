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
- [pnpm](https://pnpm.io/) 10+ (`corepack enable` or `brew install pnpm`)
- [Rust](https://www.rust-lang.org/) (install via Homebrew: `brew install rust`)
- macOS (primary target)

## Development

```bash
cd mdhaus
pnpm install
pnpm tauri:dev
```

Web-only (no Tauri shell):

```bash
pnpm dev
```

## Build

```bash
pnpm tauri:build
```

The packaged app is written to `src-tauri/target/release/bundle/` as **open mdHaus.app**.

## Install (Homebrew)

```bash
brew tap klanghaus/tap
brew install --cask open-mdhaus
```

Requires a [GitHub release](https://github.com/KlangHaus/mdhaus/releases) (tag `v*`, built by CI).

### First release (maintainers)

1. Ensure **Settings → Actions → General → Workflow permissions** is set to **Read and write**.
2. Tag and push: `git tag v0.1.0 && git push origin v0.1.0`
3. Wait for the [Release workflow](.github/workflows/release.yml) to finish.
4. Update the cask checksums: `./scripts/update-cask-sha.sh v0.1.0`
5. Push `homebrew-tap/` to [KlangHaus/homebrew-tap](https://github.com/KlangHaus/homebrew-tap).

Optional: add Apple code-signing secrets (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) for notarized builds without Gatekeeper warnings.

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
