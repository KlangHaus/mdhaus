#!/usr/bin/env bash
set -euo pipefail

# Updates homebrew-tap/Casks/open-mdhaus.rb with sha256 checksums from a GitHub release.
# Usage: ./scripts/update-cask-sha.sh v0.1.0

TAG="${1:-}"
REPO="KlangHaus/mdhaus"
CASK_FILE="homebrew-tap/Casks/open-mdhaus.rb"

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 vX.Y.Z" >&2
  exit 1
fi

VERSION="${TAG#v}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$CASK_FILE" ]]; then
  echo "Missing $CASK_FILE" >&2
  exit 1
fi

fetch_sha() {
  local arch="$1"
  local url="https://github.com/${REPO}/releases/download/${TAG}/open%20mdHaus_${VERSION}_${arch}.dmg"
  curl -fsSL "$url" | shasum -a 256 | awk '{print $1}'
}

echo "Fetching aarch64 checksum..."
AARCH64_SHA="$(fetch_sha aarch64)"
echo "Fetching x64 checksum..."
X64_SHA="$(fetch_sha x64)"

perl -i -pe "
  s/version \"[^\"]+\"/version \"${VERSION}\"/;
" "$CASK_FILE"

perl -i -0pe "
  s/on_arm do\\n    sha256 \"[^\"]+\"/on_arm do\\n    sha256 \"${AARCH64_SHA}\"/;
  s/on_intel do\\n    sha256 \"[^\"]+\"/on_intel do\\n    sha256 \"${X64_SHA}\"/;
" "$CASK_FILE"

echo "Updated $CASK_FILE for ${VERSION}"
grep -E 'version|sha256' "$CASK_FILE"
